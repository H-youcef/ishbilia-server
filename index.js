const dotenv = require('dotenv');
dotenv.config();

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

const Connection = require("./Connection.js");


wss.on("listening", ()=>{
  console.log("The server is running.");
});

wss.on('connection', function connection(ws, request) {
  console.log("New Connection")
  const newConnection = new Connection(ws);
});


