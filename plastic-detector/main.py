import time

import cv2
import serial
import serial.tools.list_ports
from ultralytics import YOLO

PLASTIC_CLASSES = {"bottle", "cup", "toothbrush", "frisbee", "remote", "fork"}
IGNORE_CLASSES = {"person"}  # don't sort the person holding the item

STABLE_FRAMES = 8     # same verdict this many frames in a row before the lid moves
COOLDOWN = 4.0        # seconds to wait after moving the lid before sorting again
SERIAL_PORT = None    # e.g. "COM5"; None = auto-detect the board

# USB vendor IDs of the boards we support (Pico + common ESP32 USB chips)
BOARD_VIDS = {
    0x2E8A,  # Raspberry Pi Pico
    0x10C4,  # Silicon Labs CP210x
    0x1A86,  # WCH CH340 / CH9102
    0x303A,  # Espressif native USB (ESP32-S2/S3/C3)
    0x0403,  # FTDI
}


def find_board_port():
    for p in serial.tools.list_ports.comports():
        if p.vid in BOARD_VIDS:
            return p.device
    return None


port = SERIAL_PORT or find_board_port()
board = None
if port:
    try:
        is_pico = any(p.device == port and p.vid == 0x2E8A for p in serial.tools.list_ports.comports())
        board = serial.Serial()
        board.port, board.baudrate, board.timeout = port, 115200, 0
        # Pico needs DTR on to accept data; an ESP32 needs DTR/RTS off or it resets on connect
        board.dtr = board.rts = is_pico
        board.open()
        print(f"Connected to board on {port}")
    except serial.SerialException as e:
        board = None
        print(f"Could not open {port} ({e}). Is Thonny still connected? Running without the lid.")
else:
    print("Board not found. Running without the lid.")


def send(cmd):
    if board:
        board.write((cmd + "\n").encode())


model = YOLO("yolo26n.pt")
cap = cv2.VideoCapture(0)

last_verdict = None
streak = 0
busy_until = 0.0
failed_reads = 0

while True:
    ok, frame = cap.read()
    if not ok:
        # webcams on Windows often drop the first few frames; only give up if it keeps failing
        failed_reads += 1
        if failed_reads >= 50:
            print("Could not read from camera. Close other apps using it (Teams, Discord, Zoom, "
                  "Camera app, another Sortify window) or try a different index in cv2.VideoCapture().")
            break
        time.sleep(0.1)
        continue
    failed_reads = 0

    result = model(frame, verbose=False, conf=0.4)[0]
    boxes = result.boxes
    keep = [i for i in range(len(boxes)) if result.names[int(boxes.cls[i])] not in IGNORE_CLASSES]

    verdict = None
    if not keep:
        status, color = "NOTHING DETECTED", (200, 200, 200)
    else:
        # pick the detection with the largest box area
        xyxy = boxes.xyxy[keep]
        areas = (xyxy[:, 2] - xyxy[:, 0]) * (xyxy[:, 3] - xyxy[:, 1])
        i = keep[int(areas.argmax())]
        name = result.names[int(boxes.cls[i])]
        x1, y1, x2, y2 = map(int, boxes.xyxy[i])

        if name in PLASTIC_CLASSES:
            verdict = "P"
            status, color = f"PLASTIC ({name})", (0, 200, 0)
        else:
            verdict = "N"
            status, color = f"NOT PLASTIC ({name})", (0, 0, 255)

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)

    # only move the lid once the verdict has been steady for a few frames
    now = time.time()
    if now < busy_until:
        status += "  [SORTING...]"
        last_verdict, streak = None, 0
    elif verdict and verdict == last_verdict:
        streak += 1
        if streak >= STABLE_FRAMES:
            send(verdict)
            print(f"Sent {verdict} ({status})")
            busy_until = now + COOLDOWN
            last_verdict, streak = None, 0
    else:
        last_verdict, streak = verdict, 1

    cv2.putText(frame, status, (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
    cv2.imshow("Sortify", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
if board:
    board.close()
