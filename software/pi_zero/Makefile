# ==============================================================================
# BioGuardian – Edge Impulse Inferencing  (Raspberry Pi Zero / POSIX)
# ==============================================================================
#
# Usage (on the Pi Zero or a Linux cross-compile host):
#   make                  – build the bioguardian binary
#   make clean            – remove build artefacts
#   make check_headers    – syntax-only compile to verify all headers resolve
#
# Cross-compile from a Linux x86-64 host:
#   make CC=arm-linux-gnueabihf-gcc CXX=arm-linux-gnueabihf-g++ AR=arm-linux-gnueabihf-ar
# ==============================================================================

# ── Toolchain ─────────────────────────────────────────────────────────────────
CXX     ?= g++
CC      ?= gcc
AR      ?= ar
STRIP   ?= strip

# ── Project layout ────────────────────────────────────────────────────────────
ROOT        := .
EI_SDK      := $(ROOT)/edge-impulse-sdk
MODEL_PARAMS := $(ROOT)/model-parameters
TFLITE_DIR  := $(ROOT)/tflite-model
BUILD_DIR   := $(ROOT)/build

TARGET      := $(BUILD_DIR)/bioguardian

# ── C++ standard ──────────────────────────────────────────────────────────────
CXXSTD      := -std=c++14

# ── Preprocessor defines ──────────────────────────────────────────────────────
DEFINES := \
    -DEI_PORTING_POSIX=1 \
    -DEI_CLASSIFIER_ENABLE_DETECTION_POSTPROCESS_OP=0

# ── Include flags ─────────────────────────────────────────────────────────────
INCLUDES := \
    -I$(ROOT) \
    -I$(EI_SDK) \
    -I$(MODEL_PARAMS) \
    -I$(TFLITE_DIR) \
    -I$(EI_SDK)/third_party/flatbuffers/include \
    -I$(EI_SDK)/third_party/gemmlowp \
    -I$(EI_SDK)/third_party/ruy \
    -I$(EI_SDK)/CMSIS/DSP/Include \
    -I$(EI_SDK)/CMSIS/Core/Include

# ── Warning / optimisation flags ─────────────────────────────────────────────
COMMON_FLAGS := \
    -Wall \
    -Wno-unused-variable \
    -Wno-unused-function \
    -Wno-sign-compare \
    -fmessage-length=0 \
    -O2

# Uncomment for native Pi Zero build:
# ARCH_FLAGS := -march=armv6zk -mtune=arm1176jzf-s -mfpu=vfp -mfloat-abi=hard

CXXFLAGS := $(CXXSTD) $(COMMON_FLAGS) $(ARCH_FLAGS) $(DEFINES) $(INCLUDES)
CFLAGS   := -std=c11  $(COMMON_FLAGS) $(ARCH_FLAGS) $(DEFINES) $(INCLUDES)
LDFLAGS  := -lm

# ── Source discovery ──────────────────────────────────────────────────────────

# Application
APP_SRCS := $(ROOT)/main.cpp

# POSIX porting layer
PORTING_SRCS := \
    $(EI_SDK)/porting/posix/ei_classifier_porting.cpp \
    $(EI_SDK)/porting/posix/debug_log.cpp

# Classifier C-linkage wrapper
CLASSIFIER_SRCS := \
    $(EI_SDK)/classifier/ei_run_classifier_c.cpp

# DSP helpers
DSP_SRCS := \
    $(EI_SDK)/dsp/memory.cpp \
    $(EI_SDK)/dsp/kissfft/kiss_fft.cpp \
    $(EI_SDK)/dsp/kissfft/kiss_fftr.cpp

# TFLite model stub (empty)
MODEL_SRCS := \
    $(TFLITE_DIR)/tflite_learn_1107164_11.cpp

# TFLite Micro runtime  (all .cc under tensorflow/)
TFLITE_SRCS := $(shell find $(EI_SDK)/tensorflow -name "*.cc" 2>/dev/null)

# All C sources under tensorflow/ (there are a few)
TFLITE_C_SRCS := $(shell find $(EI_SDK)/tensorflow -name "*.c" 2>/dev/null)

# ── Aggregate ─────────────────────────────────────────────────────────────────
ALL_CXX_SRCS := \
    $(APP_SRCS) \
    $(PORTING_SRCS) \
    $(CLASSIFIER_SRCS) \
    $(DSP_SRCS) \
    $(MODEL_SRCS) \
    $(TFLITE_SRCS)

ALL_C_SRCS := $(TFLITE_C_SRCS)

# ── Object files ─────────────────────────────────────────────────────────────
OBJ_CXX := $(patsubst %.cpp,$(BUILD_DIR)/%.cpp.o, \
            $(patsubst %.cc,$(BUILD_DIR)/%.cc.o,$(ALL_CXX_SRCS)))
OBJ_C   := $(patsubst %.c,$(BUILD_DIR)/%.c.o,$(ALL_C_SRCS))
OBJS    := $(OBJ_CXX) $(OBJ_C)

# ── Default target ────────────────────────────────────────────────────────────
.PHONY: all clean check_headers

all: $(TARGET)

$(TARGET): $(OBJS)
	@mkdir -p $(dir $@)
	$(CXX) $(CXXSTD) -o $@ $^ $(LDFLAGS)
	@echo "Built: $@"

# ── Compile rules ─────────────────────────────────────────────────────────────
$(BUILD_DIR)/%.cpp.o: %.cpp
	@mkdir -p $(dir $@)
	$(CXX) $(CXXFLAGS) -c $< -o $@

$(BUILD_DIR)/%.cc.o: %.cc
	@mkdir -p $(dir $@)
	$(CXX) $(CXXFLAGS) -c $< -o $@

$(BUILD_DIR)/%.c.o: %.c
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c $< -o $@

# ── Header-resolution check (syntax only, no object output) ───────────────────
# Run this on the host machine to verify all includes resolve correctly.
check_headers:
	@echo "=== Syntax-check: main.cpp ==="
	$(CXX) $(CXXFLAGS) -fsyntax-only $(ROOT)/main.cpp && echo "  OK"
	@echo "=== Syntax-check: ei_classifier_porting.cpp (POSIX) ==="
	$(CXX) $(CXXFLAGS) -fsyntax-only \
	    $(EI_SDK)/porting/posix/ei_classifier_porting.cpp && echo "  OK"
	@echo "=== Syntax-check: ei_run_classifier_c.cpp ==="
	$(CXX) $(CXXFLAGS) -fsyntax-only \
	    $(EI_SDK)/classifier/ei_run_classifier_c.cpp && echo "  OK"
	@echo "All header checks passed."

# ── Clean ─────────────────────────────────────────────────────────────────────
clean:
	rm -rf $(BUILD_DIR)
	@echo "Cleaned."
