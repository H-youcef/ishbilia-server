
//TODO: read the doc/README.md for the protocol implementation.

const PING_MAX_FAILS = process.env['PING_MAX_FAILS'] || 3;
const COORDINATOR_API_KEY = process.env['COORDINATOR_API_KEY'];
const COURIER_API_KEY = process.env['COURIER_API_KEY'];

const Tea = require("./Tea");
const { Binary } = require("mongodb");
const { json } = require("express");
const tea = new Tea(process.env['TEA_ENCRYPTION_KEY']);


const couriersConns = [];
const coordinatorsConns = [];
const trackersConns = [];

class Connection{

	constructor(ws, dbManager){
		this.dbManager = dbManager;
		this.ws = ws;
		this.id = null;
		this.roles=null;
		this.status = 'offline';
		this.type = ''; //Determined by the api_key
		this.location = {};
		this.lastLocationUpdateTime = 0;
		this.ping_fails = 0;

		this.pingInterval = setInterval( () => this.ping(), process.env['PING_INTERVAL'] || 10000);

		// Life check of the webSocket (ws)
		this.ws.isAlive = true;
		this.ws.on('pong', () => this.handlePong());


		//If a client does not authenticate within 1sec, the socket gets closed.
		this.loginTimeout = setTimeout(()=>{
			console.log("Closing connection for not login in time")
			this.ws.terminate();

		},process.env['LOGIN_TIMEOUT'] || 1000);


		this.ws.on('message', (message) => {
			this.handleMessage(message);
		});

		this.ws.on('close',() => {
			this.handleClose();
		});
		
	}
	/**
	 * Sends JsonObject to WebSocket client.
	 * @param {JSON} toStringify 
	 */
	send(toStringify){
		try {
			const clearMessage = JSON.stringify(toStringify);
			const encMessage = tea.encrypt(clearMessage);
			this.ws.send(encMessage);
		} catch (error) {
			console.log("Not sending message due to Error while encrypting message: ", error.message);
		}
		
	}
	/**
	 * Sends all courier infos to this websocket.
	 */
	sendCouriersInfos(){
		for(let i = 0; i < couriersConns.length; ++i){
			this.send(couriersConns[i].info);
		}
	}
	
	/**
	 * Sends the json object to all Coordinators.
	 * @param {Object} jsonMessage 
	 */
	sendToAllCoordinators(jsonMessage){
		for(let i = 0; i < coordinatorsConns.length; ++i){
			coordinatorsConns[i].send(jsonMessage);
		}
	}

	/**
	 * Sends the json object to all couriers.
	 * @param {Object} jsonMessage 
	 */
	sendToAllCouriers(jsonMessage){
		for(let i = 0; i < couriersConns.length; ++i){
			couriersConns[i].send(jsonMessage);
		}
	}

	/**
	 * Sends a ping every pingInterval.
	 */
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

		coordinatorsConns.forEach(sendPing);
		couriersConns.forEach(sendPing);
	}

	handlePong(){
		this.ws.isAlive = true;
		this.ping_fails = 0;
	}

	handleClose(){
	//deletes this Connection object from connections array
		if(this.type === 'COORDINATOR'){
			for(let i = 0; i < coordinatorsConns.length; ++i){
				if(coordinatorsConns[i].id === this.id){
					coordinatorsConns.splice(i, 1);
				}
			}
			console.log("Coordinator deleted id: ",this.id);
			
		}else if(this.type === 'COURIER'){
			this.status = "offline";
			this.broadcastStatus();
			for(let i = 0; i < couriersConns.length; ++i){
				if(couriersConns[i].id === this.id){
					couriersConns.splice(i, 1);
				}
			}
			console.log("Courier deleted id: ",this.id);

		}
		if(this.loginTimeout) clearTimeout(this.loginTimeout);
		if(this.pingInterval) clearInterval(this.pingInterval);
		console.log("Connection closed");
	}

	onSuccessfulLogin(){
		this.send({type:"reply", cmd:"login", value: "success"});
	}
	
	onFailedLogin(why){
		const reason = why ? why : 'Unknown reason';
		console.log(`The new connection failed due to ${reason}`);
		this.send({type:"reply", cmd:"login", value: "failed", reason: reason});
		this.ws.terminate();
	}
	/**
	 * Called when a new message arrives.
	 * @param {Binary} message 
	 */
	handleMessage(message){
		let clearMessage;

		//Decrypt the message
		try {
			clearMessage = tea.decrypt(message);	
		} catch (error) {
			console.log("Terminating connection due to Error while decrypting message: ", error.message);
			if(this.id !== null){
				//if this is a Registred connection either (COORDINATOR or COURIER)
				// reply with error message.
				this.send({type:"error", value: "bad-data"});
			}else{
				// if not a Registred connection, terminate the connection.
				this.ws.terminate();
			}
			return;
		}
		
		//Parse the json data
		let jsonMessage = {};
		try {
			jsonMessage = JSON.parse(clearMessage);
		}catch (e) {
			if(this.id !== null){
				//if this is a Registred connection either (COORDINATOR or COURIER)
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
		
		// (this.id === null) The client is not logged in
		if(this.id === null){
			
			if(jsonMessage['type'] !== 'login'){
				this.onFailedLogin("bad_login_message");
				return;
			}
			
			const api_key = jsonMessage['api_key'];

			if(api_key !== COORDINATOR_API_KEY && api_key !== COURIER_API_KEY){
				this.onFailedLogin("wrong_api_key");
				return;
			}

			const username = jsonMessage['username'];
			const password = jsonMessage['password'];

			if(!username || !password){
				this.onFailedLogin("bad_login_message");
				return;
			}
			clearTimeout(this.loginTimeout);

			this.dbManager.getLoginByUsernameAndPassword(username, password, 
				(error, doc) => {
					if(error){
						console.log('Error fetching username and password from Db: ', error.message);
						this.onFailedLogin('database_error');
						return;
					}
					if(doc === null){
						this.onFailedLogin('wrong_username_or_password');
						return;
					}
					
					this.id    = doc['_id'].toString();
					this.roles = doc['roles'];

					if(api_key === COORDINATOR_API_KEY){
						coordinatorsConns.push(this);
						this.type = 'COORDINATOR';
						
						console.log("new coordinator id: ", this.id);
						//Don't put this function call outside if scope since it should be called first.
						this.onSuccessfulLogin();
						this.sendAllCouriersListWithStatus();

					}else if(api_key === COURIER_API_KEY){
						couriersConns.push(this);
						this.type = 'COURIER';
						this.status = "online";
						console.log("new courier id: ", this.id);
						//Don't put this function call outside if scope since it should be called first.
						this.onSuccessfulLogin();
						this.broadcastStatus();
					}
					
			});

		}else{
			if(this.type === 'COORDINATOR'){
				this.handleCoordinatorMessage(jsonMessage);

			}else if(this.type === 'COURIER'){
				this.handleCourierMessage(jsonMessage);
			}
		}
	}

	///Coordinator's methods

	sendAllCouriersListWithStatus(){
		this.dbManager.getAllCourierLogins((error, docs)=>{
			if(error){
				console.log("Error while getting Db logins: ", error.message);
				return;
			}

			let couriersList = [];
			for(let i = 0; i < docs.length; ++i){
				const courierId = docs[i]['_id'].toString();
				let statusObject = {
					courier_id : courierId,
					username   : docs[i]['username'],
					status     : 'offline'
				};

				for(let i = 0; i < couriersConns.length; ++i){
					if(couriersConns[i].id === courierId){
						if(couriersConns[i].status === 'online'){
							statusObject.status = 'online';
							const durationSinceLastLocationUpdate = ( (Date.now() / 1000) - couriersConns[i].lastLocationUpdateTime);
							if ( durationSinceLastLocationUpdate <= 60){
								statusObject.latitude  = couriersConns[i].location.latitude;
								statusObject.longitude = couriersConns[i].location.longitude;
								statusObject.accuracy  = couriersConns[i].location.accuracy;
								statusObject.speed     = couriersConns[i].location.speed;
							}		
						}
					}
				}
				couriersList.push(statusObject);
			}
			const couriersListObject = {
				type: 'couriers-list',
				list: couriersList
			};
			this.send(couriersListObject);
		});
	}

	handleCoordinatorMessage(jsonMessage){
		if(jsonMessage['type'] === 'request'){
			if(jsonMessage['value'] === 'couriers-list'){
				this.sendAllCouriersListWithStatus();
			}
		}
	}


	/// Courier methods

	broadcastStatus(){
		let statusObject = {
			type: 'courier-status-update',
			courier_id: this.id,
			status: this.status,
		};
		
		if(this.status === 'online' && ( (Date.now() / 1000) - this.lastLocationUpdateTime) <= 60){
			statusObject.latitude = this.location.latitude;
			statusObject.longitude = this.location.longitude;
			statusObject.accuracy = this.location.accuracy;
			statusObject.speed = this.location.speed;
		}

		for(let i = 0; i < coordinatorsConns.length; ++i){
			coordinatorsConns[i].send(statusObject);
		}
		for(let i = 0; i < trackersConns.length; ++i){
			trackersConns[i].send(statusObject);
		}
	}

	broadcastLocationUpdate(){
		const locationUpdateObject = {
			type       : 'location-update',
			courier_id : this.id,
			latitude   : this.location.latitude,
			longitude  : this.location.longitude,
			accuracy   : this.location.accuracy, 
			speed      : this.location.speed
		};
		
		for(let i = 0; i < coordinatorsConns.length; ++i){
			coordinatorsConns[i].send(locationUpdateObject);
		}
		for(let i = 0; i < trackersConns.length; ++i){
			trackersConns[i].send(locationUpdateObject);
		}
	}

	handleCourierMessage(jsonMessage){
		if(jsonMessage['type'] === 'location-update'){
			const latitude = jsonMessage['latitude'];
			const longitude = jsonMessage['longitude'];

			if(isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))){
				this.send({type:"error", value: "bad-data"});
				return;
			}

			this.location.latitude = latitude;
			this.location.longitude = longitude;
			this.location.accuracy = 0;
			this.location.speed = 0;
			this.lastLocationUpdateTime = Date.now() / 1000;

			const accuracy = jsonMessage['accuracy'];
			const speed = jsonMessage['speed'];
			if(!isNaN(parseFloat(accuracy)))
				this.location.accuracy = accuracy;
			if(!isNaN(parseFloat(speed)))
				this.location.speed = speed;

			this.broadcastLocationUpdate();
		}
	}
}

module.exports = Connection;