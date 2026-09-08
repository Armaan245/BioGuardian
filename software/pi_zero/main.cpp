/**
 * BioGuardian – Edge Impulse Inferencing Entry Point
 *
 * Target : Raspberry Pi Zero (armv6 / Linux / POSIX porting layer)
 * Impulse: BioGuardian project 1107164  (pH + O2 + glucose, 3-axis fusion)
 * Labels : "failure", "healthy"
 *
 * Build  : see CMakeLists.txt or Makefile in this directory
 */

// Must be defined BEFORE any EI SDK header
#define EI_PORTING_POSIX 1

#include "edge-impulse-sdk/classifier/ei_run_classifier.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static const size_t FEATURE_SIZE = EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE;

// Placeholder feature buffer (pH, O2, glucose) x 30 frames = 90 floats
static float features[90] = {
    7.40f, 98.0f, 100.0f,   7.41f, 97.5f,  99.8f,   7.39f, 98.2f, 100.2f,
    7.40f, 98.0f, 100.0f,   7.41f, 97.5f,  99.8f,   7.39f, 98.2f, 100.2f,
    7.40f, 98.0f, 100.0f,   7.41f, 97.5f,  99.8f,   7.39f, 98.2f, 100.2f,
    7.40f, 98.0f, 100.0f,   7.41f, 97.5f,  99.8f,   7.39f, 98.2f, 100.2f,
    7.40f, 98.0f, 100.0f,   7.41f, 97.5f,  99.8f,   7.39f, 98.2f, 100.2f,
    7.40f, 98.0f, 100.0f,   7.41f, 97.5f,  99.8f,   7.39f, 98.2f, 100.2f,
    7.40f, 98.0f, 100.0f,   7.41f, 97.5f,  99.8f,   7.39f, 98.2f, 100.2f,
    7.40f, 98.0f, 100.0f,   7.41f, 97.5f,  99.8f,   7.39f, 98.2f, 100.2f,
    7.40f, 98.0f, 100.0f,   7.41f, 97.5f,  99.8f,   7.39f, 98.2f, 100.2f,
    7.40f, 98.0f, 100.0f,   7.41f, 97.5f,  99.8f,   7.39f, 98.2f, 100.2f,
};

int get_signal_data(size_t offset, size_t length, float *out_ptr) {
    if (offset + length > 90) return EI_IMPULSE_INPUT_TENSOR_WAS_NULL;
    memcpy(out_ptr, features + offset, length * sizeof(float));
    return EIDSP_OK;
}

int main(void) {
    printf("BioGuardian inferencing\n");
    signal_t signal;
    signal.total_length = 90;
    signal.get_data = &get_signal_data;
    ei_impulse_result_t result = {0};
    EI_IMPULSE_ERROR err = run_classifier(&signal, &result, false);
    if (err != EI_IMPULSE_OK) {
        printf("ERROR: %d\n", err);
        return EXIT_FAILURE;
    }
    for (size_t i = 0; i < EI_CLASSIFIER_LABEL_COUNT; i++)
        printf("  %s: %.4f\n", result.classification[i].label, result.classification[i].value);
    return EXIT_SUCCESS;
}
