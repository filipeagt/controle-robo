//////////////////////////////////////////////////////
// CONFIG
//////////////////////////////////////////////////////

const socket = new WebSocket("ws://192.168.0.200:81");

// PWM máximo
const PWM_MAX = 1023;

// Deadzone do analógico
const DEADZONE = 0.08;

//////////////////////////////////////////////////////
// BUFFER PWM
//////////////////////////////////////////////////////

// GPIO0 -> analógico esquerdo frente
// GPIO1 -> analógico esquerdo trás
// GPIO2 -> analógico direito frente
// GPIO3 -> analógico direito trás

const pwm = new Uint16Array(4);

//////////////////////////////////////////////////////
// COMANDOS CÂMERA
//////////////////////////////////////////////////////
const PTZ_UP=0;
const PTZ_UP_STOP=1;
const PTZ_DOWN=2;
const PTZ_DOWN_STOP=3;
const PTZ_LEFT=4;
const PTZ_LEFT_STOP=5;
const PTZ_RIGHT=6;
const PTZ_RIGHT_STOP=7;
const PTZ_LEFT_UP=90;
const PTZ_RIGHT_UP=91;
const PTZ_LEFT_DOWN=92;
const PTZ_RIGHT_DOWN=93;
const PTZ_STOP=1;

const PTZ_CENTER=25;

const PTZ_VPATROL=26;
const PTZ_VPATROL_STOP=27;
const PTZ_HPATROL=28;
const PTZ_HPATROL_STOP=29;

const IO_ON=94;
const IO_OFF=95;

const IR = 14;
const LEDS_OFF = 1;
const LEDS_ON = 0;
let ir_state= false;

let ptz_state = {
    'up': false,
    'down': false,
    'left': false,
    'right': false
};

function ptzCommand(cmd) {
    var url;
    url='http://192.168.0.201:81/decoder_control.cgi?';
    url+='&loginuse=filipe&loginpas=242526';
    url+='&command=' + cmd + '&onestep=0';
    url+='&' + new Date().getTime() + Math.random();
    fetch(url, { mode: 'no-cors' }).catch(error => console.error('Error sending PTZ command:', error));
}

function camera_control(param,value) {
    var url;
    url='http://192.168.0.201:81/camera_control.cgi?';
    url+='&loginuse=filipe&loginpas=242526';
    url+='&param='+param+'&value='+value;
    url+='&' + new Date().getTime() + Math.random();
    fetch(url, { mode: 'no-cors' }).catch(error => console.error('Error sending camera command:', error));
}

//////////////////////////////////////////////////////
// AUXILIAR
//////////////////////////////////////////////////////

function mapAxis(value){

    // remove ruído do centro
    if(Math.abs(value) <= DEADZONE){
        return 0;
    }

    // converte -1..1 para 0..1023
    return Math.floor(Math.abs(value) * PWM_MAX);
}


// estado anterior dos botões
const previousState = {
    'start': false,
    'select': false,
    'b1': false,
    'b2': false,
    'b3': false,
    'b4': false,
    'l1': false,
    'r1': false,
    'l2': false,
    'r2': false
};

//////////////////////////////////////////////////////
// LOOP PRINCIPAL
//////////////////////////////////////////////////////

function updateGamepad(){

    const gamepads = navigator.getGamepads();

    if(!gamepads[0]){
        requestAnimationFrame(updateGamepad);
        return;
    }

    const gp = gamepads[0];

    //////////////////////////////////////////////////////
    // BOTÕES
    //////////////////////////////////////////////////////

    const b1 = gp.buttons[0].pressed || ptz_state.up;
    const b2 = gp.buttons[1].pressed || ptz_state.right;
    const b3 = gp.buttons[2].pressed || ptz_state.down;
    const b4 = gp.buttons[3].pressed || ptz_state.left;
    const start = gp.buttons[9].pressed;
    const select = gp.buttons[8].pressed;
    const l1 = gp.buttons[4].pressed;
    const r1 = gp.buttons[5].pressed;
    const l2 = gp.buttons[6].pressed;
    const r2 = gp.buttons[7].pressed;

    if(b1 && !previousState.b1){
        previousState.b1 = true;
        if (!previousState.b2 && !previousState.b3 && !previousState.b4) {
            ptzCommand(PTZ_UP);
        } else if (previousState.b2 && !previousState.b3 && !previousState.b4) {
            ptzCommand(PTZ_RIGHT_UP);
        } else if (!previousState.b2 && !previousState.b3 && previousState.b4) {
            ptzCommand(PTZ_LEFT_UP);
        }
    }
    else if(!b1 && previousState.b1){
        previousState.b1 = false;
        if (!previousState.b2 && !previousState.b3 && !previousState.b4) {
            ptzCommand(PTZ_UP_STOP);
        } else if (previousState.b2 && !previousState.b3 && !previousState.b4) {
            ptzCommand(PTZ_RIGHT);
        } else if (!previousState.b2 && !previousState.b3 && previousState.b4) {
            ptzCommand(PTZ_LEFT);
        }
    }
    else if(b2 && !previousState.b2){
        previousState.b2 = true;
        if (!previousState.b1 && !previousState.b3 && !previousState.b4) {
            ptzCommand(PTZ_RIGHT);
        } else if (previousState.b1 && !previousState.b3 && !previousState.b4) {
            ptzCommand(PTZ_RIGHT_UP);
        } else if (!previousState.b1 && previousState.b3 && !previousState.b4) {
            ptzCommand(PTZ_RIGHT_DOWN);
        }
    }
    else if(!b2 && previousState.b2){
        previousState.b2 = false;
        if (!previousState.b1 && !previousState.b3 && !previousState.b4) {
            ptzCommand(PTZ_RIGHT_STOP);
        } else if (previousState.b1 && !previousState.b3 && !previousState.b4) {
            ptzCommand(PTZ_UP);
        } else if (!previousState.b1 && previousState.b3 && !previousState.b4) {
            ptzCommand(PTZ_DOWN);
        }
    }
    else if(b3 && !previousState.b3){
        previousState.b3 = true;
        if (!previousState.b1 && !previousState.b2 && !previousState.b4) {
            ptzCommand(PTZ_DOWN);
        } else if (!previousState.b1 && !previousState.b2 && previousState.b4) {
            ptzCommand(PTZ_LEFT_DOWN);
        } else if (!previousState.b1 && previousState.b2 && !previousState.b4) {
            ptzCommand(PTZ_RIGHT_DOWN);
        }
    }
    else if(!b3 && previousState.b3){
        previousState.b3 = false;
        if (!previousState.b1 && !previousState.b2 && !previousState.b4) {
            ptzCommand(PTZ_DOWN_STOP);
        } else if (!previousState.b1 && !previousState.b2 && previousState.b4) {
            ptzCommand(PTZ_LEFT);
        } else if (!previousState.b1 && previousState.b2 && !previousState.b4) {
            ptzCommand(PTZ_RIGHT);
        }
    }
    else if(b4 && !previousState.b4){
        previousState.b4 = true;
        if (!previousState.b1 && !previousState.b2 && !previousState.b3) {
            ptzCommand(PTZ_LEFT);
        } else if (!previousState.b1 && !previousState.b2 && previousState.b3) {
            ptzCommand(PTZ_LEFT_DOWN);
        } else if (previousState.b1 && !previousState.b2 && !previousState.b3) {
            ptzCommand(PTZ_LEFT_UP);
        }
    }
    else if(!b4 && previousState.b4){
        previousState.b4 = false;
        if (!previousState.b1 && !previousState.b2 && !previousState.b3) {
            ptzCommand(PTZ_LEFT_STOP);
        } else if (!previousState.b1 && !previousState.b2 && previousState.b3) {
            ptzCommand(PTZ_DOWN);
        } else if (previousState.b1 && !previousState.b2 && !previousState.b3) {
            ptzCommand(PTZ_UP);
        }
    } else if(start && !previousState.start){
        previousState.start = true;
        ptzCommand(PTZ_CENTER);
    }
    else if(!start && previousState.start){
        previousState.start = false;
    }
    else if(select && !previousState.select){
        previousState.select = true;
        if (!ir_state) {
            camera_control(IR, LEDS_ON);
            ir_state = true;
        } else {
            camera_control(IR, LEDS_OFF);
            ir_state = false;
        }
    }
    else if(!select && previousState.select){
        previousState.select = false;
    }
    else if(l1 && !previousState.l1){
        previousState.l1 = true;
        ptzCommand(PTZ_VPATROL);
    }
    else if(!l1 && previousState.l1){
        previousState.l1 = false;
    }
    else if(r1 && !previousState.r1){
        previousState.r1 = true;
        ptzCommand(PTZ_HPATROL);
    }
    else if(!r1 && previousState.r1){
        previousState.r1 = false;
    }
    else if(l2 && !previousState.l2){
        previousState.l2 = true;
        ptzCommand(PTZ_VPATROL_STOP);
    }
    else if(!l2 && previousState.l2){
        previousState.l2 = false;
    }
    else if(r2 && !previousState.r2){
        previousState.r2 = true;
        ptzCommand(PTZ_HPATROL_STOP);
    }
    else if(!r2 && previousState.r2){
        previousState.r2 = false;
    }

    //////////////////////////////////////////////////////
    // ANALÓGICO ESQUERDO (eixo Y = axis 1) (eixo X = axis 0)
    //////////////////////////////////////////////////////

    const leftX = gp.axes[0]
    const leftY = gp.axes[1];

    // frente
    if (leftY < -DEADZONE && leftX <= DEADZONE && leftX >= -DEADZONE) {
        pwm[1] = 0;
        pwm[3] = 0;
        pwm[0] = mapAxis(leftY);
        pwm[2] = mapAxis(leftY);
    } 
    // trás
    else if (leftY > DEADZONE && leftX <= DEADZONE && leftX >= -DEADZONE) {
        pwm[0] = 0;
        pwm[2] = 0;
        pwm[1] = mapAxis(leftY);
        pwm[3] = mapAxis(leftY);
    }
    // direita
    else if(leftY <= DEADZONE && leftY >= -DEADZONE && leftX > DEADZONE){
        pwm[1] = 0;
        pwm[2] = 0;
        pwm[0] = mapAxis(leftX);
        pwm[3] = mapAxis(leftX);
    }
    // esquerda
    else if(leftY <= DEADZONE && leftY >= -DEADZONE && leftX < -DEADZONE){
        pwm[0] = 0;
        pwm[3] = 0;
        pwm[1] = mapAxis(leftX);
        pwm[2] = mapAxis(leftX);
    }
    // esquerda frente
    else if(leftY < -DEADZONE && leftX < -DEADZONE){  
        pwm[0] = 0;  
        pwm[1] = 0;
        pwm[3] = 0;
        pwm[2] = mapAxis(leftX);
    }
    // esquerda trás
    else if(leftY > DEADZONE && leftX < -DEADZONE){   
        pwm[0] = 0;
        pwm[2] = 0; 
        pwm[3] = 0;
        pwm[1] = mapAxis(leftX);
    }
    // direita frente
    else if(leftY < -DEADZONE && leftX > DEADZONE){
        pwm[1] = 0;
        pwm[2] = 0;
        pwm[3] = 0;
        pwm[0] = mapAxis(leftX);
    }
    // direita trás
    else if(leftY > DEADZONE && leftX > DEADZONE){   
        pwm[0] = 0;
        pwm[1] = 0; 
        pwm[2] = 0;
        pwm[3] = mapAxis(leftX);
    }
    else if (leftY <= DEADZONE && leftY >= -DEADZONE && leftX <= DEADZONE && leftX >= -DEADZONE){
        pwm[0] = 0;
        pwm[1] = 0;
        pwm[2] = 0;
        pwm[3] = 0;
    }

    //////////////////////////////////////////////////////
    // ANALÓGICO DIREITO (eixo Y = axis 2) (eixo X = axis 3)
    //////////////////////////////////////////////////////

    const rightX = gp.axes[3]
    const rightY = gp.axes[2];

    // frente
    if (rightY < -DEADZONE && rightX <= DEADZONE && rightX >= -DEADZONE) {
        ptz_state.up = true;
        ptz_state.down = false;
        ptz_state.left = false;
        ptz_state.right = false;
    } 
    // trás
    else if (rightY > DEADZONE && rightX <= DEADZONE && rightX >= -DEADZONE) {
        ptz_state.down = true;
        ptz_state.up = false;
        ptz_state.left = false;
        ptz_state.right = false;
    }
    // direita
    else if(rightY <= DEADZONE && rightY >= -DEADZONE && rightX > DEADZONE){
        ptz_state.right = true;
        ptz_state.up = false;
        ptz_state.down = false;
        ptz_state.left = false;
    }
    // esquerda
    else if(rightY <= DEADZONE && rightY >= -DEADZONE && rightX < -DEADZONE){
        ptz_state.left = true;
        ptz_state.up = false;
        ptz_state.down = false;
        ptz_state.right = false;
    }
    // esquerda frente
    else if(rightY < -DEADZONE && rightX < -DEADZONE){  
        ptz_state.up = true;
        ptz_state.left = true;
        ptz_state.down = false;
        ptz_state.right = false;
    }
    // esquerda trás
    else if(rightY > DEADZONE && rightX < -DEADZONE){   
        ptz_state.down = true;
        ptz_state.left = true;
        ptz_state.up = false;
        ptz_state.right = false;
    }
    // direita frente
    else if(rightY < -DEADZONE && rightX > DEADZONE){
        ptz_state.up = true;
        ptz_state.right = true;
        ptz_state.down = false;
        ptz_state.left = false;
    }
    // direita trás
    else if(rightY > DEADZONE && rightX > DEADZONE){   
        ptz_state.down = true;
        ptz_state.right = true;
        ptz_state.up = false;
        ptz_state.left = false;
    }
    else if (rightY <= DEADZONE && rightY >= -DEADZONE && rightX <= DEADZONE && rightX >= -DEADZONE){
        ptz_state.up = false;
        ptz_state.down = false;
        ptz_state.left = false;
        ptz_state.right = false;
    }



    //////////////////////////////////////////////////////
    // DIRECIONAIS (eixo Y = axis 5) (eixo X = axis 4)
    //////////////////////////////////////////////////////

    const dirY = gp.axes[5];
    const dirX = gp.axes[4];

    // frente
    if(dirY == -1 && dirX == 0){

        pwm[0] = PWM_MAX;
        pwm[2] = PWM_MAX;

    }
    // trás
    else if(dirY == 1 && dirX == 0){

        pwm[1] = PWM_MAX;
        pwm[3] = PWM_MAX;

    }
    // direita
    else if(dirY == 0 && dirX == 1){

        pwm[0] = PWM_MAX;
        pwm[3] = PWM_MAX;

    }
    // esquerda
    else if(dirY == 0 && dirX == -1){    

        pwm[1] = PWM_MAX;
        pwm[2] = PWM_MAX;

    }
    // esquerda frente
    else if(dirY == -1 && dirX == -1){    

        pwm[2] = PWM_MAX;

    }
    // esquerda trás
    else if(dirY == 1 && dirX == -1){    

        pwm[1] = PWM_MAX;

    }
    // direita frente
    else if(dirY == -1 && dirX == 1){

        pwm[0] = PWM_MAX;

    }
    // direita trás
    else if(dirY == 1 && dirX == 1){    

        pwm[3] = PWM_MAX;

    }


    //////////////////////////////////////////////////////
    // ENVIO WEBSOCKET
    //////////////////////////////////////////////////////

    if(socket.readyState === WebSocket.OPEN){
        socket.send(pwm);
    }

    requestAnimationFrame(updateGamepad);
}

//////////////////////////////////////////////////////
// EVENTOS
//////////////////////////////////////////////////////

window.addEventListener("gamepadconnected", (e) => {

    console.log("Controle conectado:");
    console.log(e.gamepad);

    updateGamepad();
});