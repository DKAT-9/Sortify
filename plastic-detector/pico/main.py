# MicroPython code for the Raspberry Pi Pico (save to the Pico as main.py).
# Listens on USB serial for "P" (plastic) or "N" (not plastic) and moves the bin lid servo.

import sys
import time
from machine import Pin, PWM

SERVO_PIN = 15          # GP15 -> servo signal (orange/yellow wire)

# "standard"   = normal servo like SG90 / MG996R (moves to an angle, only 0-180 total)
# "continuous" = 360-degree continuous-rotation servo (spins for a set time)
SERVO_TYPE = "standard"

# --- standard servo settings ---
CENTER_ANGLE = 90       # lid closed / resting
PLASTIC_ANGLE = 0       # tip one way  (swap these two if the directions are backwards)
NOT_PLASTIC_ANGLE = 180 # tip the other way

# --- continuous servo settings ---
SPIN_SPEED = 0.6        # 0..1, how fast to spin
SPIN_TIME_180 = 0.55    # seconds it takes to turn ~180 degrees at SPIN_SPEED (calibrate this!)

HOLD_TIME = 1.5         # seconds to keep the lid tipped so the item falls in

# Pulse widths in microseconds. SG90 is usually ~500-2500. Narrow these if the servo buzzes at the ends.
MIN_US = 500
MAX_US = 2500

servo = PWM(Pin(SERVO_PIN))
servo.freq(50)
led = Pin("LED", Pin.OUT)


def write_us(us):
    servo.duty_u16(int(us * 65535 / 20000))  # 20 ms period at 50 Hz


def set_angle(angle):
    angle = max(0, min(180, angle))
    write_us(MIN_US + (MAX_US - MIN_US) * angle / 180)


def spin(speed):
    # speed -1..1 ; 0 = stop (1500 us). Negative = one direction, positive = the other.
    write_us(1500 + speed * (MAX_US - MIN_US) / 2)


def tip(direction):
    # direction = -1 for plastic (left), +1 for not plastic (right)
    led.on()
    if SERVO_TYPE == "standard":
        set_angle(PLASTIC_ANGLE if direction < 0 else NOT_PLASTIC_ANGLE)
        time.sleep(HOLD_TIME)
        set_angle(CENTER_ANGLE)
        time.sleep(0.5)
    else:
        spin(direction * SPIN_SPEED)
        time.sleep(SPIN_TIME_180)
        spin(0)
        time.sleep(HOLD_TIME)
        spin(-direction * SPIN_SPEED)
        time.sleep(SPIN_TIME_180)
        spin(0)
    led.off()


# start in the resting position
if SERVO_TYPE == "standard":
    set_angle(CENTER_ANGLE)
else:
    spin(0)

while True:
    line = sys.stdin.readline().strip().upper()
    if line == "P":
        tip(-1)
        print("DONE P")
    elif line == "N":
        tip(+1)
        print("DONE N")
