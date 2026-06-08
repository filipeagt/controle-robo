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
IPAddress dns(8,8,8,8);

//////////////////////////////////////////////////////

WebSocketsServer webSocket(81);

const uint8_t gpios[4] = {0,1,2,3};

unsigned long ultimoComando = 0;
bool clienteConectado = false;

//////////////////////////////////////////////////////
// Zera todos os PWM
//////////////////////////////////////////////////////

void pararTudo() {

    for (int i = 0; i < 4; i++) {
        analogWrite(gpios[i], 0);
    }
}

//////////////////////////////////////////////////////

void webSocketEvent(uint8_t num,
                    WStype_t type,
                    uint8_t * payload,
                    size_t length) {

    switch (type) {

        case WStype_CONNECTED:

            clienteConectado = true;
            ultimoComando = millis();

            break;

        case WStype_DISCONNECTED:

            clienteConectado = false;
            pararTudo();

            break;

        case WStype_BIN:

            if (length == 8) {

                ultimoComando = millis();

                uint16_t* pwm = (uint16_t*)payload;

                for (int i = 0; i < 4; i++) {

                    analogWrite(
                        gpios[i],
                        constrain(pwm[i], 0, 1023)
                    );
                }
            }

            break;

        default:
            break;
    }
}

void setup() {

    analogWriteRange(1023);

    for (int i = 0; i < 4; i++) {

        pinMode(gpios[i], OUTPUT);
        analogWrite(gpios[i], 0);
    }

    WiFi.config(local_IP, gateway, subnet, dns);

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {

        delay(500);
    }

    webSocket.begin();
    webSocket.onEvent(webSocketEvent);

    pararTudo();
}

void loop() {

    webSocket.loop();

    // Timeout de 100 ms sem comandos
    if (clienteConectado &&
        (millis() - ultimoComando > 100)) {

        pararTudo();
    }

    yield();
}
