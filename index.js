const dotenv = require('dotenv');
dotenv.config();

const MongoClient = require('mongodb').MongoClient;



const WebSocket = require('ws');
let wss = null;
const ConnectionsModule = require("./Connection.js");

const Connection = ConnectionsModule.Connection;
const initDbCollections = ConnectionsModule.initDbCollections;

/**
 * Create the database client used to create collections connections. 
 */
const dbUsername = process.env['ATLAS_DB_USERNAME'];
const dbPassword = process.env['ATLAS_DB_PASSWORD'];
const dbUri = `mongodb+srv://${dbUsername}:${dbPassword}@cluster-ishbilia.oskgm.mongodb.net?retryWrites=true&w=majority&tls=true`;  
const dbClient = new MongoClient(dbUri, { useUnifiedTopology: true, tls: true});


dbClient.connect( (error) => {
  if(error){
    console.log("Failed to connect to Database server: ", error.message);
    throw error;
  }
  initDbCollections(dbClient);

  wss = new WebSocket.Server({ port: process.env.PORT || 3000 , host: "0.0.0.0"});
  
  wss.on("listening", ()=>{
    console.log("The server is running.");
  });
    
  wss.on('connection', function connection(ws, request) {
    console.log("New Connection")
    const newConnection = new Connection(ws);
  });
});
