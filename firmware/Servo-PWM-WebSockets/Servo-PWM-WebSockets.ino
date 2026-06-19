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
// Servos
//////////////////////////////////////////////////////

Servo servo0;
Servo servo1;

const uint8_t servoPin0 = 0;
const uint8_t servoPin1 = 1;

//////////////////////////////////////////////////////
// PWM
//////////////////////////////////////////////////////

const uint8_t pwmPin0 = 2;
const uint8_t pwmPin1 = 3;

//////////////////////////////////////////////////////

unsigned long ultimoComando = 0;
bool clienteConectado = false;

//////////////////////////////////////////////////////
// Para tudo
//////////////////////////////////////////////////////

void pararTudo() {

    // Centro dos servos
    servo0.writeMicroseconds(1500);
    servo1.writeMicroseconds(1500);

    // PWM desligado
    analogWrite(pwmPin0, 0);
    analogWrite(pwmPin1, 0);
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

                //////////////////////////////////////////////////////
                // Servos
                //////////////////////////////////////////////////////

                uint16_t servo0_us =
                    constrain(dados[0], 1000, 2000);

                uint16_t servo1_us =
                    constrain(dados[1], 1000, 2000);

                servo0.writeMicroseconds(servo0_us);
                servo1.writeMicroseconds(servo1_us);

                //////////////////////////////////////////////////////
                // PWM
                //////////////////////////////////////////////////////

                analogWrite(
                    pwmPin0,
                    constrain(dados[2], 0, 1023)
                );

                analogWrite(
                    pwmPin1,
                    constrain(dados[3], 0, 1023)
                );
            }

            break;

        default:
            break;
    }
}

void setup() {

    analogWriteRange(1023);
    analogWriteFreq(1000);

    //////////////////////////////////////////////////////
    // PWM
    //////////////////////////////////////////////////////

    pinMode(pwmPin0, OUTPUT);
    pinMode(pwmPin1, OUTPUT);

    //////////////////////////////////////////////////////
    // Servos
    //////////////////////////////////////////////////////

    servo0.attach(servoPin0);
    servo1.attach(servoPin1);

    //////////////////////////////////////////////////////

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

    // Fail-safe: 100 ms sem comandos
    if (clienteConectado &&
        (millis() - ultimoComando > 100)) {

        pararTudo();
    }

    yield();
}
