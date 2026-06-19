#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <Servo.h>

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

//////////////////////////////////////////////////////
// SERVOS
//////////////////////////////////////////////////////

Servo servo[4];

const uint8_t servoPins[4] = {0,1,2,3};

//////////////////////////////////////////////////////

unsigned long ultimoComando = 0;
bool clienteConectado = false;

//////////////////////////////////////////////////////
// Coloca todos os servos em posição neutra
//////////////////////////////////////////////////////

void pararTudo() {

    for (int i = 0; i < 4; i++) {

        servo[i].writeMicroseconds(1500);
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

                uint16_t* dados = (uint16_t*)payload;

                for (int i = 0; i < 4; i++) {

                    servo[i].writeMicroseconds(
                        constrain(dados[i], 1000, 2000)
                    );
                }
            }

            break;

        default:
            break;
    }
}

void setup() {

    //////////////////////////////////////////////////////
    // Inicializa servos
    //////////////////////////////////////////////////////

    for (int i = 0; i < 4; i++) {

        servo[i].attach(servoPins[i]);
    }

    pararTudo();

    //////////////////////////////////////////////////////
    // WiFi
    //////////////////////////////////////////////////////

    WiFi.config(local_IP, gateway, subnet, dns);

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {

        delay(500);
    }

    //////////////////////////////////////////////////////
    // WebSocket
    //////////////////////////////////////////////////////

    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
}

void loop() {

    webSocket.loop();

    //////////////////////////////////////////////////////
    // Fail-safe: 100 ms sem receber comandos
    //////////////////////////////////////////////////////

    if (clienteConectado &&
        (millis() - ultimoComando > 100)) {

        pararTudo();
    }

    yield();
}
