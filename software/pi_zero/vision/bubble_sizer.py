import cv2
import numpy as np
import math

def calculate_bubble_metrics(image_path, channel_width_mm=2.0, known_channel_px=200):
    """
    Analyzes a snapshot frame to calculate bubble diameter (d), 
    estimated volume, and risk category.
    """
    # Pixel-to-Millimeter Scale
    scale_mm_per_px = channel_width_mm / known_channel_px  # e.g., 0.01 mm/px
    
    # Load Image
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        # Generate synthetic test frame if image path doesn't exist
        img = np.ones((300, 400), dtype=np.uint8) * 220
        # Draw channel walls
        cv2.rectangle(img, (100, 0), (300, 300), 180, -1)
        # Draw a synthetic bubble (radius 30px = 0.6mm in a 2.0mm channel -> Shearing Bubble)
        cv2.circle(img, (200, 150), 30, 30, -1)

    # 1. Binarization / Thresholding
    _, thresh = cv2.threshold(img, 100, 255, cv2.THRESH_BINARY_INV)

    # 2. Contour Detection
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return {"status": "NO_BUBBLE_DETECTED"}

    # Take the largest detected contour in the channel
    c = max(contours, key=cv2.contourArea)
    (x, y), radius_px = cv2.minEnclosingCircle(c)
    
    # 3. Size Calculations
    diameter_px = radius_px * 2.0
    diameter_mm = diameter_px * scale_mm_per_px
    
    # Volume estimation (Sphere formula: V = 4/3 * pi * r^3)
    radius_mm = diameter_mm / 2.0
    volume_uL = (4.0 / 3.0) * math.pi * (radius_mm ** 3)  # 1 mm^3 = 1 uL

    # 4. Risk Classification (Relative to Channel Width W = 2.0 mm)
    ratio = diameter_mm / channel_width_mm
    
    if ratio < 0.25:
        category = "MICRO_BUBBLE"
        risk_level = "MINIMAL"
        action = "LOG_EVENT_KEEP_VALVE_OPEN"
    elif 0.25 <= ratio < 1.0:
        category = "SHEARING_BUBBLE"
        risk_level = "HIGH_RISK"
        action = "ALERT_PREPARE_PURGE_VALVE"
    else:
        category = "MACRO_SLUG"
        risk_level = "CATASTROPHIC"
        action = "CLOSE_CHIP_VALVE_DIVERT_TO_TRAP"

    return {
        "diameter_mm": round(diameter_mm, 3),
        "volume_uL": round(volume_uL, 4),
        "category": category,
        "risk_level": risk_level,
        "action": action
    }

if __name__ == "__main__":
    print("=================================================")
    print("   BioGuardian Vision Engine - OpenCV Sizer      ")
    print("=================================================")
    
    metrics = calculate_bubble_metrics("test_frame.jpg")
    
    print(f"\n[EVENT LOGGED]")
    print(f" -> Bubble Diameter : {metrics['diameter_mm']} mm")
    print(f" -> Estimated Volume: {metrics['volume_uL']} uL")
    print(f" -> Classification  : {metrics['category']}")
    print(f" -> Risk Level      : {metrics['risk_level']}")
    print(f" -> System Action   : {metrics['action']}")
    print("\n=================================================")