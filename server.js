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
    else if (event.type === "atMinutes") {
        if (R.contains(minutes, event.minutes)) {
            controlData[event.set] = event.value
            setTimeout(() => {
                controlData[event.set] = !event.value
            }, event.duration)
        }
    }
}

function handleAction(action) {
    if (action.type === "controlSwitch") {
        
        let switchTo
        if(controlData[action.control])
            switchTo = Tinkerforge.BrickletRemoteSwitch.SWITCH_TO_ON
        else 
            switchTo = Tinkerforge.BrickletRemoteSwitch.SWITCH_TO_OFF

        asyncQueue.enqueue(() => {
            return new Promise((resolve, reject) => {
                rs.on(Tinkerforge.BrickletRemoteSwitch.CALLBACK_SWITCHING_DONE,() => {
                    resolve()
                })
                rs.switchSocketA(action.channel, action.switchID, switchTo)
            })
        })
    }
}

function control () {
    R.forEach(handleEvent, controlConfig.events)
    R.forEach(handleAction, controlConfig.actions)
}

let asyncQueue = {
    delay: 10,
    isRunning: false,
    queue: [],
    enqueue: function(action) {
        this.queue.push(action)

        if (!this.isRunning) {
            this.run()
        }
    },
    enqueueWithDelay: function(action) {
        let delayed = () => {
            return new Promise((resolve, reject) => {
                action()
                setTimeout(resolve, this.delay)
            })
        } 
        this.enqueue(delayed)
    },
    run: function() {
        this.isRunning = true

        if (!R.isEmpty(this.queue)) {
            const action = this.queue[0]
            this.queue = R.drop(1, this.queue)

            action().finally(() => this.run())
        } else {
            this.isRunning = false
        }
    }
}