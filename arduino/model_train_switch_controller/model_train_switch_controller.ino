/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

const unsigned short THRESHOLD_UPPER = 800;
const unsigned short THRESHOLD_LOWER = 400;

const byte ANALOG_PHOTORESISTOR_PIN = A0;
const byte ACKNOWLEDGE_DIRECTION_BUTTON_PIN = 2;
const byte COMMUNICATION_LED_PIN = 3;
const byte STRAIGHT_DIRECTION_LED_PIN = 4;
const byte DETOUR_DIRECTION_LED_PIN = 5;
const byte CHANGE_DIRECTION_LED_PIN = 6;

bool switchPosition = true; // True = straight, False = detour
volatile bool acknowledged = true;



void setup() {
  Serial.begin(1000000);

  pinMode(COMMUNICATION_LED_PIN, OUTPUT);
  pinMode(STRAIGHT_DIRECTION_LED_PIN, OUTPUT);
  pinMode(DETOUR_DIRECTION_LED_PIN, OUTPUT);
  pinMode(CHANGE_DIRECTION_LED_PIN, OUTPUT);
  pinMode(ACKNOWLEDGE_DIRECTION_BUTTON_PIN, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(ACKNOWLEDGE_DIRECTION_BUTTON_PIN), acknowledgeButtonPressed, FALLING);
  
  printSwitchPosition(true);
}

void acknowledgeButtonPressed() {
  printSwitchPosition(true);
  acknowledged = true;
}

void loop() {
  if (!acknowledged) {
    do {
      
    } while (!acknowledged);
    sendAcknowledgement();
  }
  
  // Wait for it to go HIGH
  do {

  } while (analogRead(ANALOG_PHOTORESISTOR_PIN) <= THRESHOLD_LOWER);
  // It went HIGH, note the time and wait for it to go LOW again
  unsigned long startMicros = micros();
  unsigned long timeoutMillis = millis() + 5000;
  do {
    if (millis() >= timeoutMillis) {
      return;
    }
  } while (analogRead(ANALOG_PHOTORESISTOR_PIN) <= THRESHOLD_UPPER);
  do {
    if (millis() >= timeoutMillis) {
      return;
    }
  } while (analogRead(ANALOG_PHOTORESISTOR_PIN) >= THRESHOLD_LOWER);
  // It went HIGH and then LOW again
  unsigned long endMicros = micros();
  unsigned long microsPeriod1 = endMicros - startMicros;
  timeoutMillis = millis() + 5000;
  // Wait for it to go HIGH again
  do {
    if (millis() >= timeoutMillis) {
      return;
    }
  } while (analogRead(ANALOG_PHOTORESISTOR_PIN) <= THRESHOLD_UPPER);
  // It went HIGH again, note the time that it spent LOW and note the start time
  unsigned long microsPeriod2 = micros() - endMicros;
  startMicros = micros();
  timeoutMillis = millis() + 5000;
  do {
    if (millis() >= timeoutMillis) {
      return;
    }
  } while (analogRead(ANALOG_PHOTORESISTOR_PIN) >= THRESHOLD_LOWER);
  // It went HIGH and then LOW again
  endMicros = micros();
  unsigned long microsPeriod3 = endMicros - startMicros;

  if ((microsPeriod1 > 300000) && (microsPeriod1 < 700000) && (microsPeriod2 > 300000) && (microsPeriod2 < 700000) && (microsPeriod3 > 300000) && (microsPeriod3 < 700000)) {
    // Signal 1
    changeSwitchPosition(true);
  } else if ((microsPeriod1 > 1300000) && (microsPeriod1 < 1700000) && (microsPeriod2 > 1300000) && (microsPeriod2 < 1700000) && (microsPeriod3 > 1300000) && (microsPeriod3 < 1700000)) {
    // Signal 2
    changeSwitchPosition(false);
  } else {
    sendNonAcknowledgement();
  }
}

void changeSwitchPosition(bool newSwitchPosition) {
  if (switchPosition == newSwitchPosition) {
    sendAcknowledgement();
    return;
  }

  switchPosition = newSwitchPosition;
  acknowledged = false;
  printSwitchPosition(false);
}

void printSwitchPosition(bool acknowledged) {
  if (switchPosition) {
    digitalWrite(STRAIGHT_DIRECTION_LED_PIN, HIGH);
    digitalWrite(DETOUR_DIRECTION_LED_PIN, LOW);
  } else {
    digitalWrite(STRAIGHT_DIRECTION_LED_PIN, LOW);
    digitalWrite(DETOUR_DIRECTION_LED_PIN, HIGH);
  }
  if (acknowledged) {
    digitalWrite(CHANGE_DIRECTION_LED_PIN, LOW);
  } else {
    digitalWrite(CHANGE_DIRECTION_LED_PIN, HIGH);
  }
}

void sendAcknowledgement() {
  digitalWrite(COMMUNICATION_LED_PIN, HIGH);
  delay(500);
  digitalWrite(COMMUNICATION_LED_PIN, LOW);
  delay(1500);
  digitalWrite(COMMUNICATION_LED_PIN, HIGH);
  delay(500);
  digitalWrite(COMMUNICATION_LED_PIN, LOW);
}

void sendNonAcknowledgement() {
  digitalWrite(COMMUNICATION_LED_PIN, HIGH);
  delay(1500);
  digitalWrite(COMMUNICATION_LED_PIN, LOW);
  delay(500);
  digitalWrite(COMMUNICATION_LED_PIN, HIGH);
  delay(1500);
  digitalWrite(COMMUNICATION_LED_PIN, LOW);
}
