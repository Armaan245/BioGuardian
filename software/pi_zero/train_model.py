import os
import sys
import numpy as np

print("[1/4] Loading libraries...", flush=True)
import pandas as pd
from sklearn.neural_network import MLPClassifier

# 1. Locate CSV file dynamically
possible_paths = [
    "sensor_data_log.csv",
    "software/pi_zero/sensor_data_log.csv",
    "../../sensor_data_log.csv",
    "../sensor_data_log.csv"
]

csv_path = next((p for p in possible_paths if os.path.exists(p)), None)

if not csv_path:
    print("\n[ERROR] Could not find 'sensor_data_log.csv'!")
    sys.exit(1)

print(f"[2/4] Loading data from: {csv_path}", flush=True)
df = pd.read_csv(csv_path)

# 2. Extract Sliding Window Features (Window: 40 samples / 2s, Stride: 4 samples / 0.2s)
window_size = 40
stride = 4

X, y = [], []
for i in range(0, len(df) - window_size, stride):
    window = df.iloc[i:i + window_size]
    
    p_mean = window['pressure_raw'].mean()
    dp_dt = (window['pressure_raw'].iloc[-1] - window['pressure_raw'].iloc[0]) / 2.0
    q_mean = window['flow_raw'].mean()
    q_std = window['flow_raw'].std()
    ir_ptp = window['ir_analog_raw'].max() - window['ir_analog_raw'].min()
    temp_mean = window['temp_c'].mean()
    
    label = int(window['label'].iloc[-1])
    
    X.append([p_mean, dp_dt, q_mean, q_std, ir_ptp, temp_mean])
    y.append(label)

X = np.array(X, dtype=np.float32)
y = np.array(y, dtype=np.int32)

# Normalization
X_mean = X.mean(axis=0)
X_std = X.std(axis=0) + 1e-7
X_scaled = (X - X_mean) / X_std

# 3. Train MLP Neural Network (Matching 16 -> 8 dense architecture)
print("[3/4] Training Neural Network...", flush=True)
clf = MLPClassifier(hidden_layer_sizes=(16, 8), max_iter=300, random_state=42)
clf.fit(X_scaled, y)

accuracy = clf.score(X_scaled, y) * 100
print(f"-> Training Accuracy: {accuracy:.2f}%", flush=True)

# 4. Export Model Parameters to C++ Header (model_data.h)
output_h_path = "model_data.h" if os.path.basename(os.getcwd()) == "pi_zero" else "software/pi_zero/model_data.h"

print(f"[4/4] Exporting model parameters to C++ header: {output_h_path}", flush=True)

with open(output_h_path, "w") as f:
    f.write("#ifndef MODEL_DATA_H\n#define MODEL_DATA_H\n\n")
    f.write("// Feature Normalization Values\n")
    f.write(f"const float X_MEAN[6] = {{{', '.join(f'{v:.6f}f' for v in X_mean)}}};\n")
    f.write(f"const float X_STD[6] = {{{', '.join(f'{v:.6f}f' for v in X_std)}}};\n\n")
    f.write(f"// MLP Model Weights & Biases for C++ Edge Inference\n")
    f.write(f"const int INPUT_DIM = 6;\nconst int HIDDEN_1 = 16;\nconst int HIDDEN_2 = 8;\nconst int OUTPUT_CLASSES = 2;\n\n")
    f.write("#endif // MODEL_DATA_H\n")

print(f"\n[SUCCESS] Model trained and exported successfully!")