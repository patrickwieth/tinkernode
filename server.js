var Tinkerforge = require('tinkerforge')
var http = require('http')
var R = require('ramda')

var HOST = 'localhost';
var PORT = 4223;
var rsUID = 'N3i'; // Change to your UID
var ssrUID = 'MnZ'

var ipcon = new Tinkerforge.IPConnection(); // Create IP connection
var rs = new Tinkerforge.BrickletRemoteSwitchV2(rsUID, ipcon); // remote switch connection
var ssr = new Tinkerforge.BrickletSolidStateRelayV2(ssrUID, ipcon); // ssr switch connection

ipcon.connect(HOST, PORT,
    function (error) {
        console.log('Error: ' + error);
    }
);

ipcon.on(Tinkerforge.IPConnection.CALLBACK_CONNECTED,
    function (connectReason) {
	// this is for fast debugging the remote switches
        rs.switchSocketA(7, 15, Tinkerforge.BrickletRemoteSwitchV2.SWITCH_TO_ON);
        // Switch on a type A socket with house code 17 and receiver code 1.
        // House code 17 is 10001 in binary (least-significant bit first)
        // and means that the DIP switches 1 and 5 are on and 2-4 are off.
        // Receiver code 1 is 10000 in binary (least-significant bit first)
        // and means that the DIP switch A is on and B-E are off.

	ssr.setMonoflop(true, 1000, function(res) {
		}, function(err) {
		console.log("err:"+err)
	})
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

    if (event.type === "hours") {
        if (hours < event.begin || hours >= event.end)
            controlData[event.set] = !event.value
        else 
            controlData[event.set] = event.value
    } 
    else if (event.type === "atMinutes") {
        if (R.contains(minutes, event.minutes) && seconds < 10) {
            controlData[event.set] = event.value
	    if (event.duration) {
		console.log("duration found, for "+event.duration+" set "+event.set+" to "+event.value)
        	setTimeout(() => {
        	    controlData[event.set] = !event.value
			console.log("shut off"+event.set)
        	}, event.duration)
	    }
        }
    }
}

function handleAction(action) {
     if (action.type === "controlSwitch") {

        let switchTo
        if(controlData[action.control]) {
		switchTo = Tinkerforge.BrickletRemoteSwitchV2.SWITCH_TO_ON
		console.log("switched on", action.control)
	}
        else {
		console.log("switched off", action.control)
            switchTo = Tinkerforge.BrickletRemoteSwitchV2.SWITCH_TO_OFF
	}

	asyncQueue.enqueue(() => {
		rs.switchSocketA(action.channel, action.switchID, switchTo)			
		return new Promise((resolve, reject) => {
		rs.on(Tinkerforge.BrickletRemoteSwitchV2.CALLBACK_SWITCHING_DONE,() => {
		resolve()
                })
            })
        })
    }
    if (action.type === "controlSSR") {
        if(controlData[action.control])
	    ssr.setState(true)
        else
	    ssr.setState(false)
    }
    if (action.type === "HTTPheartbeat") {
        console.log("HTTPheartbeat at ", action.route)
	try {
        	http.get(action.route, res => {
          		console.log("Heartbeat res statusCode: ", res.statusCode)
        	}).on("error", function (){console.log("GET request error")});
	} catch (error) {
		console.error(error)
	}
    }
}

function control () {
    let date_ob = new Date();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();

    console.log(hours + ":" + minutes + ":" + seconds);

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
