#ifndef MODEL_DATA_H
#define MODEL_DATA_H

// Feature Normalization Values
const float X_MEAN[6] = {1011.988220f, -0.006644f, 450.284790f, 5.873950f, 44.815025f, 24.998682f};
const float X_STD[6] = {0.130304f, 0.321899f, 1.881565f, 3.750969f, 31.705681f, 1.160135f};

// MLP Model Weights & Biases for C++ Edge Inference
const int INPUT_DIM = 6;
const int HIDDEN_1 = 16;
const int HIDDEN_2 = 8;
const int OUTPUT_CLASSES = 2;

#endif // MODEL_DATA_H
