#include <ESP8266WiFi.h>
#include "Adafruit_MQTT.h"
#include "Adafruit_MQTT_Client.h"
#include <ArduinoJson.h>
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 48 // OLED display height, in pixels
#define OLED_RESET -1   //   QT-PY / XIAO
Adafruit_SH1106G display = Adafruit_SH1106G(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);


#define NUMFLAKES 10
#define XPOS 0
#define YPOS 1
#define DELTAY 2

/* Uncomment the initialize the I2C address , uncomment only one, If you get a totally blank screen try the other*/
#define i2c_Address 0x3c //initialize with the I2C addr 0x3C Typically eBay OLED's
StaticJsonBuffer<200> jsonBuffer;


#define WLAN_SSID       "your_ssid"
#define WLAN_PASS       "your_password"

#define AIO_SERVER      "io.adafruit.com"
#define AIO_SERVERPORT  1883
#define AIO_USERNAME    "your_username"
#define AIO_KEY         "your_key"

WiFiClient client;
Adafruit_MQTT_Client mqtt(&client, AIO_SERVER, AIO_SERVERPORT, AIO_USERNAME, AIO_USERNAME, AIO_KEY);
Adafruit_MQTT_Subscribe getdata = Adafruit_MQTT_Subscribe(&mqtt, AIO_USERNAME "/feeds/getdata", MQTT_QOS_1);

void MQTT_connect() {
  int8_t ret;

  // Stop if already connected.
  if (mqtt.connected()) {
    return;
  }

  Serial.print("Connecting to MQTT... ");

  uint8_t retries = 3;
  while ((ret = mqtt.connect()) != 0) { // connect will return 0 for connected
       Serial.println(mqtt.connectErrorString(ret));
       Serial.println("Retrying MQTT connection in 5 seconds...");
       mqtt.disconnect();
       delay(10000);  // wait 5 seconds
       retries--;
       if (retries == 0) {
         // basically die and wait for WDT to reset me
         while (1);
       }
  }
  Serial.println("MQTT Connected!");
}

void setup() {
  Serial.begin(115200);
  delay(10);

  Serial.println(F("Adafruit MQTT demo"));

  // Connect to WiFi access point.
  Serial.println(); Serial.println();
  Serial.print("Connecting to ");
  Serial.println(WLAN_SSID);

  WiFi.begin(WLAN_SSID, WLAN_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  Serial.println("WiFi connected");
  Serial.println("IP address: "); 
  Serial.println(WiFi.localIP());
  display.begin(i2c_Address, true); // Address 0x3C default
 //display.setContrast (0); // dim display
  display.clearDisplay(); 
  display.display();
  delay(2000);
  
  getdata.setCallback(getdata_callback);
  mqtt.subscribe(&getdata);
 
}
void getdata_callback(char *data, uint16_t len) {
  JsonObject& root = jsonBuffer.parseObject(data);
  if(!root.success()) {
  Serial.println("parseObject() failed");
  
}
  int x1= root["issueAxis"];
  int x2= root["commitAxis"];
  int y1= root["codereviewAxis"];
  int y2= root["pullrequestAxis"];
  x1=x1+64;
  x2= 64-x2;
  y1=24-y1;
  y2=24+y2;
  //{ commitAxis: 4, issueAxis: 1, pullrequestAxis: 1, codereviewAxis: 1 }
  drawFilledTriangle(x1,y1,x2,y2);
  }

void loop() {
  MQTT_connect();
  mqtt.processPackets(10000);
  if(! mqtt.ping()) {
    mqtt.disconnect();
  }
  //tone1();
  //delay(2000);
  //tone2();

}
void drawFilledTriangle(int x1,int y1,int x2,int y2)
{
  
  display.clearDisplay();
  display.fillTriangle(x1,24,64,y1,64, 24,SH110X_WHITE);
  display.fillTriangle(x1,24,64,y2,64, 24,SH110X_WHITE);
  display.fillTriangle(x2,24,64,y1,64, 24,SH110X_WHITE);
  display.fillTriangle(x2,24,64,y2,64, 24,SH110X_WHITE);
  //display.fillTriangle(50, 24, 64, 30, 64, 24,SH110X_WHITE);
  display.display();
  delay(1);
  
  
}
