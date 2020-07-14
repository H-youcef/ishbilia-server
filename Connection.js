
///TODO:
/// --* When a Server connects, it gets notified with all existing Couriers.
/// --* When a Courier connects, all connected Servers gets notified with the new Couriers' s Data.
/// --* When a Courier disconnects all connected Servers gets notified.
// --* A Server can ask for a list of connected Couriers.
/// --* Use the ping-pong mechanism to check the connection status of the servers and/or couriers.
/// --* The couriers MUST be aware of the existence or non existence of a Server.
/// * A Server can send data to any Courier using db id.


const couriersConns = [];
const serversConns = [];
const PING_MAX_FAILS = process.env['PING_MAX_FAILS'] || 3


const Tea = require("./Tea");
const tea = new Tea(process.env['TEA_ENCRYPTION_KEY']);

class Connection{

	constructor(ws){
		
		this.ws = ws;
		this.id = 0;
		this.type = '';
		this.info = {};
		this.ping_fails = 0;

		this.pingInterval = setInterval( () => this.ping(), process.env['PING_INTERVAL'] || 10000);

		// Life check of the webSocket (ws)
		this.ws.isAlive = true;
		this.ws.on('pong', () => this.handlePong());


		//If a client does not authenticate within 1sec, the socket gets closed.
		this.authenticationTimeout = setTimeout(()=>{
			console.log("Closing connection for not authenticating in time")
			this.ws.terminate();

		},process.env['AUTENTICATION_TIMEOUT'] || 1000);


		this.ws.on('message', (message)=>{
			this.handleMessage(message);
		});

		this.ws.on('close',() => {
			this.handleClose();
		});
		
	}

	send(toStringify){
		try {
			const clearMessage = JSON.stringify(toStringify);
			const encMessage = tea.encrypt(clearMessage);
			this.ws.send(encMessage);
		} catch (error) {
			console.log("Not sending message due to Error while encrypting message: ", error.message);
		}
		
	}
	sendCouriersInfos(){
		for(let i = 0; i < couriersConns.length; ++i){
			this.send(couriersConns[i].info);
		}
	}

	notifyServers(){
		this.sendToAllServers(this.info);
	}

	sendToAllServers(jsonMessage){
		for(let i = 0; i < serversConns.length; ++i){
			serversConns[i].send(jsonMessage);
		}
	}
	sendToAllCouriers(jsonMessage){
		for(let i = 0; i < couriersConns.length; ++i){
			couriersConns[i].send(jsonMessage);
		}
	}

ping() {
		const sendPing = (con) => {
			if (con.ws.isAlive === false) {
				console.log("Ping failed");
				this.ping_fails += 1;
				if(this.ping_fails >= PING_MAX_FAILS){
					console.log(`Closing a connection for not responding to a Ping after ${this.ping_fails} fails.`);
					return con.ws.terminate();
				}
			}
			con.ws.isAlive = false;
			con.ws.ping(()=>{});
		};

		serversConns.forEach(sendPing);
		couriersConns.forEach(sendPing);
	}

	handlePong(){
		this.ws.isAlive = true;
		this.ping_fails = 0;
	}

	handleClose(){
	//deletes this Connection object from connections array
		if(this.type === 'SERVER'){
			console.log("server deleted id: ",this.id);
			for(let i = 0; i < serversConns.length; ++i){
				if(serversConns[i].id === this.id){
					serversConns.splice(i, 1);
				}
			}
			if(serversConns.length === 0){
				//Notify couriers that NO Server is available.
				this.sendToAllCouriers({type:"notification",value:"server-down"});
			}
		}else if(this.type === 'COURIER'){
			console.log("Courier deleted id: ",this.id);
			this.info['status'] = "disconnected";
			this.notifyServers();
			for(let i = 0; i < couriersConns.length; ++i){
				if(couriersConns[i].id === this.id){
					couriersConns.splice(i, 1);
				}
			}
		}
		clearInterval(this.pingInterval);
		console.log("Connection closed");
	}

	onSucessfullAuthentication(){
		clearTimeout(this.authenticationTimeout);
		this.send({type:"reply", cmd:"auth", value: "success"});
	}

	handleMessage(message){
		let clearMessage;
		try {
			clearMessage = tea.decrypt(message);	
		} catch (error) {
			console.log("Terminating connection due to Error while decrypting message: ", error.message);
			if(this.id !== 0){
				//if this is a Registred connection either (SERVER or COURIER)
				// reply with error message.
				this.send({type:"error", value: "bad-data"});
			}else{
				// if not a Registred connection, terminate the connection.
				this.ws.terminate();
			}
			return;
		}
		
		let jsonMessage = {};
		try {
			jsonMessage = JSON.parse(clearMessage);
		}catch (e) {
			if(this.id !== 0){
				//if this is a Registred connection either (SERVER or COURIER)
				// reply with error message.
				this.send({type:"error", value: "bad-data"});
			}else{
				// if not a Registred connection, terminate the connection.
				this.ws.terminate();
			}
			return;
		}
		
		//Since we received a message and parsed well, the we are sure that the socket is alive.
		this.ws.isAlive = true;

		if(this.id === 0){
			if(jsonMessage['api_key'] === process.env['SERVER_API_KEY']){
				serversConns.push(this);
				this.id = serversConns.length;
				this.type = 'SERVER';
				this.onSucessfullAuthentication();
				this.sendCouriersInfos();
				
				console.log("new server id: ", this.id);
				
				if(serversConns.length === 1){
					//notify couriers that a Server is available
					this.sendToAllCouriers({type:"notification", value:"server-up"});
				}

			}else if(jsonMessage['api_key'] === process.env['COURIER_API_KEY']){
				couriersConns.push(this);
				this.id = couriersConns.length;
				this.type = 'COURIER';
				this.info['status'] = "connected";
				Object.assign(this.info, jsonMessage['info']);

				this.onSucessfullAuthentication();
				this.notifyServers();

				console.log("new courier id: ", this.id);
				if(serversConns.length === 0){
					this.send({type:"notification",value:"server-down"});
				}else{
					this.send({type:"notification",value:"server-up"});
				}

				
			}else{
				this.send({type:"reply", cmd:"auth", value: "failed", 
									reason: "Wrong api_key"});
				this.ws.terminate();
				clearTimeout(this.authenticationTimeout);
				console.log("The new connection failed due to wrong api_key");
			}

		}else{
			if(this.type === 'SERVER'){
				this.handleServerMessage(jsonMessage);

			}else if(this.type === 'COURIER'){
				this.handleCourierMessage(jsonMessage);
			}
		}
	}

	handleServerMessage(jsonMessage){
		if(jsonMessage['type'] === 'request'){
			if(jsonMessage['value'] === 'couriers-list'){
				this.sendCouriersInfos();
			}
		}
	}

	handleCourierMessage(jsonMessage){
		//If the message came from a Courier then 
		// propagate it to all servers.		
		Object.assign(this.info, jsonMessage);
		this.notifyServers();
	}
}

module.exports = Connection;