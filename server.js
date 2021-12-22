var Tinkerforge = require('tinkerforge');

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


//control cycle
var updateInterval = 2000;
setInterval(control, updateInterval);

let on = false

function control () {

    let date_ob = new Date();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    
    // prints time in HH:MM format
    console.log(hours + ":" + minutes + ":" + seconds);

    if(minutes%2) {
        rs.switchSocketA(7, 15, Tinkerforge.BrickletRemoteSwitch.SWITCH_TO_OFF);
        on = false
    } else {
        rs.switchSocketA(7, 15, Tinkerforge.BrickletRemoteSwitch.SWITCH_TO_ON);
        on = true
    }
    
}