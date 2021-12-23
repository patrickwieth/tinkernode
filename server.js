var Tinkerforge = require('tinkerforge');
var R = require('ramda')

var HOST = 'localhost';
var PORT = 4223;
var UID = 'uYH'; // Change to your UID

var ipcon = new Tinkerforge.IPConnection(); // Create IP connection
var rs = new Tinkerforge.BrickletRemoteSwitch(UID, ipcon); // Create device object

ipcon.connect(HOST, PORT,
    function (error) {
        console.log('Error: ' + error);
    }
);

ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
    function (connectReason) {
        // Switch on a type A socket with house code 17 and receiver code 1.
        // House code 17 is 10001 in binary (least-significant bit first)
        // and means that the DIP switches 1 and 5 are on and 2-4 are off.
        // Receiver code 1 is 10000 in binary (least-significant bit first)
        // and means that the DIP switch A is on and B-E are off.
        rs.switchSocketA(7, 15, Tinkerforge.BrickletRemoteSwitch.SWITCH_TO_OFF);
    }
);



var express = require("express");
var app = express();
app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.get("/url", (req, res, next) => {
    res.json(["Tony","Lisa","Michael","Ginger","Food"]);
});


controlConfig = require('./control.json')

//control cycle
var updateInterval = 5000;
setInterval(control, updateInterval);

let controlData = {}


function handleEvent(event) {
    let date_ob = new Date();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    
    // prints time in HH:MM format
    console.log(hours + ":" + minutes + ":" + seconds);

    if (event.type === "hours") {
        if (hours < event.begin || hours >= event.end)
            controlData[event.set] = !event.value
        else 
            controlData[event.set] = event.value
    }
}

function handleAction(action) {
    if (action.type === "controlSwitch") {
        
        if(controlData[action.control]) {
            console.log("switchin on", action.channel, action.switchID, controlData[action.control])
            rs.switchSocketA(action.channel, action.switchID, Tinkerforge.BrickletRemoteSwitch.SWITCH_TO_ON);
        }
        else 
            rs.switchSocketA(action.channel, action.switchID, Tinkerforge.BrickletRemoteSwitch.SWITCH_TO_OFF);
    }
}

function control () {
    R.forEach(handleEvent, controlConfig.events)
    R.forEach(handleAction, controlConfig.actions)
}
