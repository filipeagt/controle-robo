#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>

const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";

//////////////////////////////////////////////////////
// IP FIXO
//////////////////////////////////////////////////////

IPAddress local_IP(192,168,0,200);
IPAddress gateway(192,168,0,1);
IPAddress subnet(255,255,255,0);

// opcional
IPAddress dns(8,8,8,8);

//////////////////////////////////////////////////////

WebSocketsServer webSocket(81);

const uint8_t gpios[4] = {0,1,2,3};

void webSocketEvent(uint8_t num,
                    WStype_t type,
                    uint8_t * payload,
                    size_t length){

    if(type == WStype_BIN && length == 8){

        uint16_t* pwm = (uint16_t*)payload;

        for(int i=0;i<4;i++){

            analogWrite(
                gpios[i],
                constrain(pwm[i],0,1023)
            );
        }
    }
}

void setup(){

    analogWriteRange(1023);

    for(int i=0;i<4;i++){

        pinMode(gpios[i], OUTPUT);
        analogWrite(gpios[i],0);
    }

    //////////////////////////////////////////////////////
    // CONFIGURA IP FIXO
    //////////////////////////////////////////////////////

    WiFi.config(local_IP, gateway, subnet, dns);

    //////////////////////////////////////////////////////

    WiFi.begin(ssid,password);

    while(WiFi.status() != WL_CONNECTED){

        delay(500);
    }

    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
}

void loop(){

    webSocket.loop();

    yield();
}
