const io = require("socket.io-client");
let socket = io("http://localhost:3000")
socket.send({
    "method": "crash_get_state",
    "params": {

    }
})
socket.on("reply", (msg) => {
    console.log(msg)
})