const dotenv = require('dotenv');
dotenv.config();

const DbManager = require('./DbManager');
const dbManager = new DbManager();

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 3000 , host: "0.0.0.0"});
const Connection = require("./Connection.js");

dbManager.connect((error) => {
  if(error){
    console.log("Failed to connect to Database server: ", error.message);
    throw error;
  }
  console.log("Starting WebSocket Server...");

  wss.on("listening", ()=>{
    console.log("The server is running.");
  });

  wss.on('connection', function connection(ws, request) {
    console.log("New Connection")
    const newConnection = new Connection(ws, dbManager);
  });

});
