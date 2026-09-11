import cv2
import numpy as np

STREAM_URL = "http://192.168.1.7:8080/video"

def run_mobile_bubble_tracker(source_url):
    cap = cv2.VideoCapture(source_url)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (800, 600))
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # 1. Mild blur to reduce metal grain
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # 2. Adaptive threshold focused on bubble edges
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 13, 2
        )

        # 3. Clean small noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)

        # 4. Distance transform with balanced threshold (0.28)
        dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
        _, sure_fg = cv2.threshold(dist_transform, 0.28 * dist_transform.max(), 255, 0)
        sure_fg = np.uint8(sure_fg)

        # 5. Extract contours for bubble centers
        contours, _ = cv2.findContours(sure_fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        bubble_count = 0
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 8:  # Catch true foam bubble centers
                (x, y), radius = cv2.minEnclosingCircle(cnt)
                center = (int(x), int(y))
                
                true_radius = max(3, int(dist_transform[center[1], center[0]]))
                
                # Keep detections within realistic bubble sizes
                if 3 <= true_radius <= 35:
                    bubble_count += 1
                    
                    # Draw circle & center dot
                    cv2.circle(frame, center, true_radius, (0, 255, 0), 1)
                    cv2.circle(frame, center, 2, (0, 0, 255), -1)

        # HUD display
        cv2.putText(frame, f"Total Bubbles Spotted: {bubble_count}", (20, 35), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        cv2.imshow("Mobile Camera - Bubble Tracking HUD", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run_mobile_bubble_tracker(STREAM_URL)