"""
BioGuardian Phase 04 Integration Test: Closed-Loop Reverse Control
Compiles C++ Edge AI engine, launches binary subprocess, dispatches control commands over MQTT,
and validates real-time parameter tuning and emergency purge valve actuation in stdout.
"""

import os
import queue
import subprocess
import sys
import threading
import time
import pytest

from software.twin.command_center import TwinCommandCenter


def read_stdout_lines(process, output_queue, stop_event):
    """Background thread to drain and capture subprocess stdout without deadlock."""
    try:
        for line in iter(process.stdout.readline, ''):
            if line:
                output_queue.put(line.strip())
            if stop_event.is_set():
                break
    except Exception:
        pass


def wait_for_log_pattern(output_queue, pattern, timeout_sec=5.0):
    """Polls captured output queue for a matching substring within timeout."""
    start_time = time.time()
    accumulated_logs = []
    while time.time() - start_time < timeout_sec:
        try:
            line = output_queue.get(timeout=0.2)
            accumulated_logs.append(line)
            if pattern in line:
                return True, accumulated_logs
        except queue.Empty:
            continue
    return False, accumulated_logs


@pytest.fixture(scope="module")
def compiled_cpp_engine():
    """Ensures main.cpp is compiled with g++ before running closed loop tests."""
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    src_path = os.path.join(repo_root, "software", "pi_zero", "main.cpp")
    out_binary = os.path.join(repo_root, "software", "pi_zero", "pi_zero_edge_ai.exe")

    compile_cmd = [
        "g++",
        "-O2",
        "-std=c++17",
        src_path,
        "-o",
        out_binary,
        "-lws2_32",
    ]

    print(f"\n[Test Setup] Compiling C++ Engine: {' '.join(compile_cmd)}")
    result = subprocess.run(compile_cmd, capture_output=True, text=True)
    assert result.returncode == 0, f"g++ compilation failed: {result.stderr}"
    assert os.path.exists(out_binary), "Compiled binary not found."

    return out_binary


@pytest.fixture
def cpp_process_runner(compiled_cpp_engine):
    """Launches the compiled C++ binary and drains stdout in a thread."""
    proc = subprocess.Popen(
        [compiled_cpp_engine, "127.0.0.1", "1883"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    out_q = queue.Queue()
    stop_event = threading.Event()
    reader = threading.Thread(target=read_stdout_lines, args=(proc, out_q, stop_event), daemon=True)
    reader.start()

    # Wait for process initialization & MQTT connection
    time.sleep(1.0)

    yield proc, out_q

    # Teardown
    stop_event.set()
    try:
        proc.terminate()
        proc.wait(timeout=1.0)
    except Exception:
        proc.kill()


@pytest.fixture
def command_center():
    """Provides connected TwinCommandCenter instance."""
    center = TwinCommandCenter(broker_host="127.0.0.1", broker_port=1883)
    center.connect()
    time.sleep(0.5)
    yield center
    center.disconnect()


def test_closed_loop_threshold_update(cpp_process_runner, command_center):
    """
    Verifies that send_threshold_update dispatches to C++ Edge Engine
    and the new decision threshold is applied.
    """
    proc, out_q = cpp_process_runner

    # Dispatch threshold adjustment to 0.65
    result = command_center.send_threshold_update(0.65)
    assert result["status"] == "PUBLISHED"

    # Verify C++ engine logs the threshold update event
    found, logs = wait_for_log_pattern(out_q, "UPDATE_THRESHOLD", timeout_sec=5.0)
    assert found, f"Expected UPDATE_THRESHOLD log in C++ stdout. Logs: {logs}"
    
    # Check that the logged value contains 0.65
    threshold_logged = any("0.65" in l for l in logs if "UPDATE_THRESHOLD" in l)
    assert threshold_logged, f"Expected threshold 0.65 in logs: {logs}"


def test_closed_loop_emergency_purge(cpp_process_runner, command_center):
    """
    Verifies that trigger_emergency_purge sends actuator command
    and C++ Edge Engine logs GPIO actuation.
    """
    proc, out_q = cpp_process_runner

    # Dispatch emergency purge valve override
    result = command_center.trigger_emergency_purge(state=True)
    assert result["status"] == "PUBLISHED"

    # Verify C++ engine logs the GPIO override event
    found, logs = wait_for_log_pattern(out_q, "EMERGENCY PURGE ENGAGED", timeout_sec=5.0)
    assert found, f"Expected EMERGENCY PURGE ENGAGED log in C++ stdout. Logs: {logs}"


def test_automated_closed_loop_logic(cpp_process_runner, command_center):
    """
    Verifies evaluate_closed_loop logic:
    Automatically triggers emergency purge when Physics reports degradation AND Edge AI reports bubble risk.
    """
    proc, out_q = cpp_process_runner

    # Scenario 1: Nominal state -> No purge trigger
    nominal_telemetry = {"edge_ai": {"prediction": "NOMINAL"}}
    nominal_health = {"status": "NOMINAL", "health_score": 1.0}
    action1 = command_center.evaluate_closed_loop(nominal_telemetry, nominal_health)
    assert action1 is None

    # Scenario 2: Clogging + Bubble Risk -> Emergency Purge Triggered
    critical_telemetry = {"edge_ai": {"prediction": "BUBBLE_RISK"}}
    critical_health = {"status": "CHANNEL_DEGRADATION_OR_CLOGGING", "health_score": 0.65}
    action2 = command_center.evaluate_closed_loop(critical_telemetry, critical_health)

    assert action2 is not None
    assert action2["status"] == "PUBLISHED"
    assert action2["trigger_reason"] == "PHYSICS_DEGRADATION_AND_AI_BUBBLE_RISK"

    # Verify C++ process received the automated emergency purge
    found, logs = wait_for_log_pattern(out_q, "PURGE_VALVE", timeout_sec=5.0)
    assert found, f"Expected PURGE_VALVE log from automated trigger. Logs: {logs}"
