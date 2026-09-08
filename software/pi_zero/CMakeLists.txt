cmake_minimum_required(VERSION 3.16)
project(bioguardian_inferencing CXX C ASM)

# ── C++ standard ──────────────────────────────────────────────────────────────
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ── Root directory of this CMakeLists ─────────────────────────────────────────
set(PI_ZERO_DIR ${CMAKE_CURRENT_SOURCE_DIR})
set(EI_SDK     ${PI_ZERO_DIR}/edge-impulse-sdk)

# ── Compile definitions ───────────────────────────────────────────────────────
add_definitions(
    -DEI_PORTING_POSIX=1
    -DEI_CLASSIFIER_ENABLE_DETECTION_POSTPROCESS_OP=0
)

# ── Include paths ─────────────────────────────────────────────────────────────
include_directories(
    ${PI_ZERO_DIR}                                      # project root (for model-parameters/*)
    ${PI_ZERO_DIR}/edge-impulse-sdk                     # EI SDK root
    ${PI_ZERO_DIR}/model-parameters                     # model_metadata.h, model_variables.h
    ${PI_ZERO_DIR}/tflite-model                         # tflite_*.h, trained_model_ops_define.h
    ${EI_SDK}/third_party/flatbuffers/include           # FlatBuffers
    ${EI_SDK}/third_party/gemmlowp                      # gemmlowp
    ${EI_SDK}/third_party/ruy                           # ruy
    ${EI_SDK}/CMSIS/DSP/Include                         # CMSIS-DSP
    ${EI_SDK}/CMSIS/Core/Include                        # CMSIS-Core
)

# ── Helper: recursively glob sources ─────────────────────────────────────────
include(${EI_SDK}/cmake/utils.cmake OPTIONAL)

# ── TFLite Micro sources (all .cc under tensorflow/) ─────────────────────────
file(GLOB_RECURSE TFLITE_MICRO_SOURCES
    ${EI_SDK}/tensorflow/lite/micro/*.cc
    ${EI_SDK}/tensorflow/lite/micro/kernels/*.cc
    ${EI_SDK}/tensorflow/lite/kernels/internal/*.cc
    ${EI_SDK}/tensorflow/lite/kernels/*.cc
    ${EI_SDK}/tensorflow/lite/core/api/*.cc
    ${EI_SDK}/tensorflow/lite/c/*.c
    ${EI_SDK}/tensorflow/lite/*.cc
)

# ── DSP sources ───────────────────────────────────────────────────────────────
file(GLOB_RECURSE DSP_SOURCES
    ${EI_SDK}/dsp/memory.cpp
    ${EI_SDK}/dsp/kissfft/kiss_fft.cpp
    ${EI_SDK}/dsp/kissfft/kiss_fftr.cpp
)

# ── FlatBuffers sources ───────────────────────────────────────────────────────
# (header-only; no .cc compilation needed)

# ── Porting layer (POSIX) ─────────────────────────────────────────────────────
set(PORTING_SOURCES
    ${EI_SDK}/porting/posix/ei_classifier_porting.cpp
    ${EI_SDK}/porting/posix/debug_log.cpp
)

# ── Classifier C-linkage wrapper ──────────────────────────────────────────────
set(CLASSIFIER_SOURCES
    ${EI_SDK}/classifier/ei_run_classifier_c.cpp
)

# ── TFLite model (generated, mostly empty placeholder) ───────────────────────
set(MODEL_SOURCES
    ${PI_ZERO_DIR}/tflite-model/tflite_learn_1107164_11.cpp
)

# ── Application sources ───────────────────────────────────────────────────────
set(APP_SOURCES
    ${PI_ZERO_DIR}/main.cpp
)

# ── Final executable ─────────────────────────────────────────────────────────
add_executable(bioguardian
    ${APP_SOURCES}
    ${CLASSIFIER_SOURCES}
    ${PORTING_SOURCES}
    ${DSP_SOURCES}
    ${MODEL_SOURCES}
    ${TFLITE_MICRO_SOURCES}
)

# ── Compiler flags ────────────────────────────────────────────────────────────
target_compile_options(bioguardian PRIVATE
    -Wall
    -Wno-unused-variable
    -Wno-unused-function
    -Wno-sign-compare
    -fmessage-length=0
    # Raspberry Pi Zero (ARMv6) tuning — comment out when cross-compiling from x86
    # -march=armv6zk -mtune=arm1176jzf-s -mfpu=vfp -mfloat-abi=hard
)

target_link_libraries(bioguardian m)

# ── Install ───────────────────────────────────────────────────────────────────
install(TARGETS bioguardian DESTINATION bin)
