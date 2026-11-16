/**
 * Sortify bin lid controller (Arduino IDE).
 * Waits on USB serial (115200 baud) for a command from the YOLO detector:
 *   "P" = plastic      -> turn 90 degrees one way, then back to center
 *   "N" = not plastic  -> turn 90 degrees the other way, then back to center
 * Replies "DONE P" / "DONE N" when finished.
 *
 * Works on a Raspberry Pi Pico (built-in Servo library) or an ESP32
 * (install the "ESP32Servo" library from Library Manager first).
 */

#ifdef ESP32
#include <ESP32Servo.h>
#else
#include <Servo.h>
#endif

const int SERVO_PIN = 15;

const int CENTER = 90;
const int PLASTIC_POS = 0;        // 90 degrees one way from center
const int NOT_PLASTIC_POS = 180;  // 90 degrees the other way (swap these two if backwards)
const int MOVE_DELAY = 1000;      // ms to let the servo reach its position / let the item fall

Servo servo;

void tip(int pos) {
#ifdef LED_BUILTIN
  digitalWrite(LED_BUILTIN, HIGH);
#endif
  servo.write(pos);
  delay(MOVE_DELAY);
  servo.write(CENTER);
  delay(MOVE_DELAY);
#ifdef LED_BUILTIN
  digitalWrite(LED_BUILTIN, LOW);
#endif
}

void setup() {
  Serial.begin(115200);
#ifdef LED_BUILTIN
  pinMode(LED_BUILTIN, OUTPUT);
#endif

  // SG90 pulse range is roughly 500-2400 microseconds
  servo.attach(SERVO_PIN, 500, 2400);
  servo.write(CENTER);
  delay(MOVE_DELAY);

  Serial.println("READY");
}

void loop() {
  if (!Serial.available()) return;

  String line = Serial.readStringUntil('\n');
  line.trim();
  line.toUpperCase();

  if (line == "P") {
    tip(PLASTIC_POS);
    Serial.println("DONE P");
  } else if (line == "N") {
    tip(NOT_PLASTIC_POS);
    Serial.println("DONE N");
  }
}
