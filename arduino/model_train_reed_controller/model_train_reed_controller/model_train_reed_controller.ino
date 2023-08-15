/*
This file is part of Arduino Model Train Controller V3 (https://github.com/Itzanh/arduino_model_train_controller_v3).

Arduino Model Train Controller V3 is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3 of the License.

Model Train Controller is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with Model Train Controller. If not, see <https://www.gnu.org/licenses/>.
*/

// This sketch is made to be run on an Arduino Nano, with the objective to to control a model train, controlling its onboard-motor with a L293D-chip, detecting its position
// in the tracks using magnets left along the way in the tracks in specific positions, and receiving instructions for traffic control and signaling from a computer software
// that keeps communication with the Nano through a HC-05 Bluetooth module.
//
// Pinout description: (ARDUINO UNO / NANO)
// DIGITAL:
// 2
// 3 } - Communication LED
// 4
// 5   } - L293D - { Enable (~PWM) 10Ohm
// 6   }           { DIR_B 5.2KOhm
// 7   }           { DIR_A 5.2KOhm
// 8
// 9
// 10
// 11
// 12
// 13
// A0 } - Reed switch 5V / 220Ohm to GND
// A1 } - Photoresistor 5V / 10KOhm to GND
// TX -> HC-05 RX
// RX -> HC-05 TX



// Constants
const unsigned long ACCESS_KEY = 2107106630;
// const unsigned long ACCESS_KEY = 2086438159;
// const byte MOTOR_MAX_POWER = 100;
// const byte MOTOR_MIN_POWER = 85;
// const byte MOTOR_MAX_POWER = 120;
// const byte MOTOR_MIN_POWER = 85;
// const byte MOTOR_MAX_POWER = 190;
// const byte MOTOR_MIN_POWER = 85;
const byte MOTOR_MAX_POWER = 255;
const byte MOTOR_MIN_POWER = 85;
// const byte MOTOR_MIN_POWER = 200;
const float MAX_SPEED_LIMIT = 255;
const unsigned short SOFTWARE_DEBOUNCING_WAIT = 250; // ms
const unsigned short SERIAL_BAUD_RATE = 57600;
const unsigned short THRESHOLD_UPPER = 800;
const unsigned short THRESHOLD_LOWER = 400;

// DEFINE PINOUT
// Digital
const byte COMMUNICATION_LED_PIN = 3;
const byte MOTOR_ENABLE_PIN = 5;
const byte MOTOR_DIR_A_PIN = 6;
const byte MOTOR_DIR_B_PIN = 7;
// Analog
const byte REED_SWITCH_PIN = A0;
const byte ANALOG_PHOTORESISTOR_PIN = A1;



// Variables
volatile bool reedSwitchClosed = false;
volatile long lastReedSwitchClosedTime = 0;



enum CommunicationMessageServerToClient {
  FORWARD = 1,
  BACKWARD = 2,
  FAST_STOP = 3,
  SWITCH_PASSTHROUGH = 4,
  SWITCH_DETOUR = 5,
};

enum CommunicationMessageClientToServer {
  REED_TRIGGERED = 1,
  SWITCH_SUCCESS = 2,
  SWITCH_FAILURE = 3,
};

void setup()
{
  pinMode(COMMUNICATION_LED_PIN, OUTPUT);

  // Initialize the pins for the L293D motor controller
  pinMode(MOTOR_ENABLE_PIN, OUTPUT);
  pinMode(MOTOR_DIR_A_PIN, OUTPUT);
  pinMode(MOTOR_DIR_B_PIN, OUTPUT);

  // Open a (hardware) serial connection with the HC-05 BlueTooth module
  Serial.begin(SERIAL_BAUD_RATE);
  // Log in the the ground control software through BlueTooth
  blueToothLogin();
}

void blueToothLogin()
{
  // When the ground control server is ready, it sends a byte of all ones (255) and awaits for the token
  // Wait for the "ready" byte to come
  while (Serial.available() == 0) {}
  Serial.read();
  // Send the authentication token
  Serial.write((byte*)&ACCESS_KEY, sizeof(unsigned long));
}

void loop()
{
  if (reedSwitchClosed)
  {
    reedSwitchClosed = analogRead(REED_SWITCH_PIN) >= 256;
  }
  else
  {
    if ((analogRead(REED_SWITCH_PIN) > 512) && (millis() - lastReedSwitchClosedTime > 1000))
    {
      Serial.write(1);
      Serial.write(CommunicationMessageClientToServer::REED_TRIGGERED);
      reedSwitchClosed = true;
      lastReedSwitchClosedTime = millis();
    }
  }

  while (Serial.available())
  {
    receiveIncomingCommunicationMessage();
  }
}

void receiveIncomingCommunicationMessage()
{
  byte size = Serial.read();
  byte message[size];

  for (byte i = 0; i < size; i++) {
    int b = Serial.read();
    if (b == -1)
    {
      i--;
    }
    else
    {
      message[i] = b;
    }
  }

  processIncomingMessage(message);
}

void processIncomingMessage(byte message[])
{
  switch (message[0])
  {
    case CommunicationMessageServerToClient::FORWARD:
      {
        goForward(message[1]);
        break;
      }
    case CommunicationMessageServerToClient::BACKWARD:
      {
        goBackwards(message[1]);
        break;
      }
    case CommunicationMessageServerToClient::FAST_STOP:
      {
        fastStop();
        break;
      }
    case CommunicationMessageServerToClient::SWITCH_PASSTHROUGH:
      {
        switchToPassthrough();
        break;
    } case CommunicationMessageServerToClient::SWITCH_DETOUR:
      {
        switchToDetour();
        break;
      }
  }
}

void goForward(byte speedLimit)
{
  lastReedSwitchClosedTime = millis();
  byte motorSpeed = convertSpeedLimitToMotorSpeed(speedLimit);
  analogWrite(MOTOR_ENABLE_PIN, motorSpeed);
  digitalWrite(MOTOR_DIR_A_PIN, HIGH);
  digitalWrite(MOTOR_DIR_B_PIN, LOW);
}

void goBackwards(byte speedLimit)
{
  lastReedSwitchClosedTime = millis();
  byte motorSpeed = convertSpeedLimitToMotorSpeed(speedLimit);
  analogWrite(MOTOR_ENABLE_PIN, motorSpeed);
  digitalWrite(MOTOR_DIR_A_PIN, LOW);
  digitalWrite(MOTOR_DIR_B_PIN, HIGH);
}

void fastStop()
{
  analogWrite(MOTOR_ENABLE_PIN, 255);
  digitalWrite(MOTOR_DIR_A_PIN, LOW);
  digitalWrite(MOTOR_DIR_B_PIN, LOW);
}

byte convertSpeedLimitToMotorSpeed(byte speedLimit)
{
  float relativeSpeed = float(speedLimit) / MAX_SPEED_LIMIT;
  return MOTOR_MIN_POWER + (relativeSpeed * (MOTOR_MAX_POWER - MOTOR_MIN_POWER));
}

void switchToPassthrough() {
  digitalWrite(COMMUNICATION_LED_PIN, HIGH);
  delay(500);
  digitalWrite(COMMUNICATION_LED_PIN, LOW);
  delay(500);
  digitalWrite(COMMUNICATION_LED_PIN, HIGH);
  delay(500);
  digitalWrite(COMMUNICATION_LED_PIN, LOW);

  processLEDResponse();
}

void switchToDetour() {
  digitalWrite(COMMUNICATION_LED_PIN, HIGH);
  delay(1500);
  digitalWrite(COMMUNICATION_LED_PIN, LOW);
  delay(1500);
  digitalWrite(COMMUNICATION_LED_PIN, HIGH);
  delay(1500);
  digitalWrite(COMMUNICATION_LED_PIN, LOW);

  processLEDResponse();
}

void processLEDResponse()
{
  if (waitForLEDResponse())
  {
    Serial.write(1);
    Serial.write(CommunicationMessageClientToServer::SWITCH_SUCCESS);
  }
  else
  {
    Serial.write(1);
    Serial.write(CommunicationMessageClientToServer::SWITCH_FAILURE);
  }
}

bool waitForLEDResponse() {
  // Wait for it to go HIGH
  /*do {

    } while (analogRead(ANALOG_PHOTORESISTOR_PIN) <= THRESHOLD_LOWER);*/
  do {

  } while (analogRead(ANALOG_PHOTORESISTOR_PIN) <= THRESHOLD_UPPER);
  // It went HIGH, note the time and wait for it to go LOW again
  unsigned long startMicros = micros();
  unsigned long timeoutMillis = millis() + 5000;
  do {
    if (millis() >= timeoutMillis) {
      // Serial.println("TIMEOUT 1");
      /*Serial.write(3);
      Serial.write(128);
      Serial.write("F");
      Serial.write(1);*/
      return false;
    }
  } while (analogRead(ANALOG_PHOTORESISTOR_PIN) <= THRESHOLD_UPPER);
  do {
    if (millis() >= timeoutMillis) {
      // Serial.println("TIMEOUT 2");
      /*Serial.write(3);
      Serial.write(128);
      Serial.write("F");
      Serial.write(2);*/
      return false;
    }
  } while (analogRead(ANALOG_PHOTORESISTOR_PIN) >= THRESHOLD_LOWER);
  // It went HIGH and then LOW again
  unsigned long endMicros = micros();
  unsigned long microsPeriod1 = endMicros - startMicros;
  timeoutMillis = millis() + 5000;
  // Wait for it to go HIGH again
  do {
    if (millis() >= timeoutMillis) {
      // Serial.println("TIMEOUT 3");
      /*Serial.write(3);
      Serial.write(128);
      Serial.write("F");
      Serial.write(3);*/
      return false;
    }
  } while (analogRead(ANALOG_PHOTORESISTOR_PIN) <= THRESHOLD_UPPER);
  // It went HIGH again, note the time that it spent LOW and note the start time
  unsigned long microsPeriod2 = micros() - endMicros;
  startMicros = micros();
  timeoutMillis = millis() + 5000;
  do {
    if (millis() >= timeoutMillis) {
      // Serial.println("TIMEOUT 4");
      /*Serial.write(3);
      Serial.write(128);
      Serial.write("F");
      Serial.write(4);*/
      return false;
    }
  } while (analogRead(ANALOG_PHOTORESISTOR_PIN) >= THRESHOLD_LOWER);
  // It went HIGH and then LOW again
  endMicros = micros();
  unsigned long microsPeriod3 = endMicros - startMicros;

  if ((microsPeriod1 > 300000) && (microsPeriod1 < 700000) && (microsPeriod2 > 1300000) && (microsPeriod2 < 1700000) && (microsPeriod3 > 300000) && (microsPeriod3 < 700000)) {
    // Acknowledgement
    return true;
  }
  // ... else ...
  /*Serial.print("microsPeriod1 ");
    Serial.print(microsPeriod1);
    Serial.print(" microsPeriod2 ");
    Serial.print(microsPeriod2);
    Serial.print(" microsPeriod3 ");
    Serial.println(microsPeriod3);*/
  /*Serial.write(15);
  Serial.write(128);
  Serial.write("F");
  Serial.write(5);*/

  /*Serial.write((char*)&microsPeriod1, 4);
  Serial.write((char*)&microsPeriod2, 4);
  Serial.write((char*)&microsPeriod3, 4);*/

  // Non-Acknowlegdement / Error
  return false;
}
