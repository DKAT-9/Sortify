import cv2
from ultralytics import YOLO

PLASTIC_CLASSES = {"bottle", "cup", "toothbrush", "frisbee", "remote"}

model = YOLO("yolo26n.pt")
cap = cv2.VideoCapture(0)

while True:
    ok, frame = cap.read()
    if not ok:
        print("Could not read from camera")
        break

    result = model(frame, verbose=False, conf=0.4)[0]
    boxes = result.boxes

    if len(boxes) == 0:
        status, color = "NOTHING DETECTED", (200, 200, 200)
    else:
        # pick the detection with the largest box area
        areas = (boxes.xyxy[:, 2] - boxes.xyxy[:, 0]) * (boxes.xyxy[:, 3] - boxes.xyxy[:, 1])
        i = int(areas.argmax())
        name = result.names[int(boxes.cls[i])]
        x1, y1, x2, y2 = map(int, boxes.xyxy[i])

        if name in PLASTIC_CLASSES:
            status, color = f"PLASTIC ({name})", (0, 200, 0)
        else:
            status, color = f"NOT PLASTIC ({name})", (0, 0, 255)

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)

    cv2.putText(frame, status, (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
    cv2.imshow("Sortify", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()