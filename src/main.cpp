#include <Arduino.h>
#include <ArduinoJson.h>
#include <DallasTemperature.h>
#include <ESPAsyncWebServer.h>
#include <OneWire.h>
#include <WebSocketsClient.h>
#include <WiFi.h>

#define LED_PIN_WIFI 25
#define LED_PIN_CLIENT 14
#define RELAY_LAMP 33
#define RELAY_HEATER 32
#define TEMP_PIN 21
#define CONTROL_LAMP 35
#define CONTROL_HEATER 34

// Must be 2.4GHz
// ---------- Telmen0423
// ---------- 99220101

// ---------- iO Tech 2 2.4GHZ
// ---------- io123456

#define Wifi_SSID "iO Tech 2 2.4GHZ"
#define Wifi_Password "io123456"

OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);
// AsyncWebServer server(80);
// AsyncWebSocket webSocket("/test");
WebSocketsClient webSocket;
float temprature = 0;
bool isConnected = false;
int tempValue_before = 0;
bool lampStatus = false;
bool heaterStatus = false;
int boxChecked = 0;
int custTempValue = 0;
bool isControlSoftware = false;
bool connectServer = false;

void led_on(int led_number) {
  digitalWrite(led_number, HIGH);
}

void led_off(int led_number) {
  digitalWrite(led_number, LOW);
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
  case WStype_DISCONNECTED:
    Serial.println("Client disconnected");
    digitalWrite(LED_PIN_CLIENT, !digitalRead(LED_PIN_CLIENT));
    isControlSoftware = false;
    connectServer = false;
    break;
  case WStype_CONNECTED:
    Serial.println("Client connected");
    digitalWrite(LED_PIN_CLIENT, HIGH);
    connectServer = true;
    break;
  case WStype_TEXT:
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload);

    // String log;
    // serializeJson(doc, log);
    // Serial.print("Received message: ");
    // Serial.println(log);

    if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.c_str());
      return;
    } else {
      const int data_id = doc["id"];
      if (data_id == 2) {
        const String mainState = doc["isSW"];
        if (mainState == "true") {
          isControlSoftware = true;
        } else {
          isControlSoftware = false;
        }
        Serial.println(isControlSoftware);
        if (isControlSoftware) {
          JsonObject data = doc["data"];
          const int data_document_0 = data["status_0"];
          const int data_document_2 = data["status_2"];
          boxChecked = data_document_2;
          if (data_document_2 == 1) {
            const int data_TempValue = data["newTempValue"];
            custTempValue = data_TempValue;
            if (temprature < custTempValue) {
              led_on(RELAY_HEATER);
              heaterStatus = true;
            } else {
              led_off(RELAY_HEATER);
              heaterStatus = false;
            }
          } else {
            const int data_document_1 = data["status_1"];
            if (data_document_1 == 1) {
              led_on(RELAY_HEATER);
              heaterStatus = true;
            } else {
              led_off(RELAY_HEATER);
              heaterStatus = false;
            }
          }
          if (data_document_0 == 1) {
            led_on(RELAY_LAMP);
            lampStatus = true;
          } else {
            led_off(RELAY_LAMP);
            lampStatus = false;
          }
          const int data_from_id = doc["receiver_id"];
        }
        String log;
        serializeJson(doc, log);
        Serial.print("Received message: ");
        Serial.println(log);
      }
    }
    Serial.println("");
    break;
  }
}

void esp32setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(LED_PIN_WIFI, OUTPUT);
  pinMode(LED_PIN_CLIENT, OUTPUT);
  pinMode(RELAY_LAMP, OUTPUT);
  pinMode(RELAY_HEATER, OUTPUT);
  pinMode(CONTROL_LAMP, INPUT);
  pinMode(CONTROL_HEATER, INPUT);
}

void setup() {
  Serial.begin(921600);
  esp32setup();
  WiFi.begin(Wifi_SSID, Wifi_Password);
  sensors.begin();
  // 192.168.1.124  192.168.1.124
  // 34.64.252.80

  webSocket.begin("35.239.225.185", 1880, "/ws/receive");
  // webSocket.setExtraHeaders("Accept-Encoding: gzip\r\n");
  // webSocket.setExtraHeaders("Cache-Control: no-cache\r\nAccept-Encoding: gzip\r\n");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && !isConnected) {
    Serial.print("Connected to network with IP address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(LED_PIN_WIFI, HIGH);
    digitalWrite(LED_BUILTIN, HIGH);
    isConnected = true;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Connection drop");
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
    digitalWrite(LED_PIN_WIFI, !digitalRead(LED_PIN_WIFI));
    delay(1000);
    isConnected = false;
  }

  if (!isControlSoftware) {
    int lampState = digitalRead(CONTROL_LAMP);
    int heaterState = digitalRead(CONTROL_HEATER);
    if (lampState == HIGH) {
      led_on(RELAY_LAMP);
      lampStatus = true;
      delay(50);
    } else {
      led_off(RELAY_LAMP);
      lampStatus = false;
      delay(20);
    }
    if (heaterState == HIGH) {
      led_on(RELAY_HEATER);
      heaterStatus = true;
      delay(50);
    } else {
      led_off(RELAY_HEATER);
      heaterStatus = false;
      delay(20);
    }
  }
  if (isConnected) {
    webSocket.loop();
  }

  if (isConnected && connectServer) {
    sensors.requestTemperatures();
    static unsigned long lastTime = 0;
    static unsigned long lastTimeInSec = 0;
    unsigned long currentTime = millis();
    if (currentTime - lastTime >= 100) {
      temprature = sensors.getTempCByIndex(0);
      if (boxChecked == 1) {
        if (temprature < custTempValue) {
          led_on(RELAY_HEATER);
          heaterStatus = true;
        } else {
          led_off(RELAY_HEATER);
          heaterStatus = false;
        }
      }
      if (currentTime - lastTimeInSec >= 2000) {
        String jsonString = "";
        StaticJsonDocument<200> doc;
        JsonObject object = doc.to<JsonObject>();
        object["id"] = 1;
        object["lampStatus"] = lampStatus;
        object["heaterStatus"] = heaterStatus;
        object["tempValue"] = temprature;
        serializeJson(doc, jsonString);
        webSocket.sendTXT(jsonString);
        Serial.println("Sending message :" + jsonString);
        lastTimeInSec = currentTime;
      }
      lastTime = currentTime;
    }
  }
}