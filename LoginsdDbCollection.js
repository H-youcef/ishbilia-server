const ObjectID = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;

class LoginsdDbCollection{

  /**
   * 
   * @param {MongoClient} dbClient 
   */
  constructor(dbClient){
    this.client = dbClient;
    const dbName = process.env['ATLAS_DB_NAME'];
    const loginsCollectionName = "logins";
    this.loginsCollection = this.client.db(dbName).collection(loginsCollectionName);
  }

  /**
   * returns __true__ if connected to the _data base server_ otherwise __false__. 
   * @returns returns __true__ if connected to the _data base server_ otherwise __false__. 
   */
  isConnected(){
    return this.client.isConnected();
  }

  /**
   * Gets the document for the login specified by the username and password
   * calls the callback with object containing the doc without the password
   * or an empty object if no login found.
   * the call back also takes an error arg in case of an error.
   * __callback example: function(error, doc){}__
   * @param {String} username The username of the login 
   * @param {String} password The password of the login
   * @param {Callback} callback called with the result __eg: function(error, doc){}__.
   */
  getLoginByUsernameAndPassword(username, password, callback){
    this.loginsCollection 
    .findOne( {username: username, password: password},
      { projection: { _id: 1, username: 1, roles: 1, password_changed: 1, enabled: 1}},
      (err, doc) => {  
      callback(err, doc);
    });
  }

  /**
   * Gets the document for the login specified by the id
   * calls the callback with object containing the doc without the password
   * or an empty object if no login found.
   * the call back also takes an error arg in case of an error.
   * __callback example: function(error, doc){}__
   * @param {String} id The id of the login 
   * @param {Callback} callback called with the result.
   */
  getLoginById(id, callback){
    var o_id = new ObjectID(id);
    this.loginsCollection 
    .findOne( {_id: o_id},
      { projection: { _id: 1, username: 1, roles: 1}},
      (err, doc) => {  
      callback(err, doc);
    });
  }

  /**
   * Gets all login documents and passes them to the callback
   * with an error arg in case of an error.
   * __callback example: function(error, docs){}__
   * @param {Callback} callback __function(error, docs){}__
   */
  getAllLogins(callback){
    this.loginsCollection 
    .find({},{ projection: { _id: 1, username: 1, roles: 1}} )
    .toArray((err, docs) => {  
      callback(err, docs);
    });
  }
  /**
   * Gets all couriers
   * @param {*} callback __function(error, docs){}__ called when finished
   */
  getAllCourierLogins(callback){
    this.loginsCollection 
    .find({roles: 'courier'},{ projection: { _id: 1, username: 1, roles: 1}} )
    .toArray((err, docs) => {  
      callback(err, docs);
    });
  }

  /**
   * Get logins with specific role.
   * @param {String} role a string representing a role. 
   * @param {Callback} callback __function(error, docs){}__ called when finished
   */
  getAllLoginsWithRole(role, callback){
    this.loginsCollection 
    .find({roles: role},{ projection: { _id: 1, username: 1, roles: 1}} )
    .toArray((err, docs) => {  
      callback(err, docs);
    });
  }

  /**
   * Get logins with specific roles.
   * @param {Array} roles an array of roles. 
   * @param {Callback} callback __function(error, docs){}__ called when finished
   */
  getAllLoginsWithRoles(roles, callback){
    this.loginsCollection 
    .find({roles: {$all: roles}},{ projection: { _id: 1, username: 1, roles: 1}} )
    .toArray((err, docs) => {  
      callback(err, docs);
    });
  }

  /**
   * Updates the password of the login with the newPassword.
   * __callback example: function(error){}__
   * @param {String} id The id of the login
   * @param {String} newPassword The new password to set for this login. 
   * @param {Callback} callback __callback example: function(error){}__ called with the result.
   */
  updatePasswordById(id, newPassword, callback){
    var o_id = new ObjectID(id);
    this.loginsCollection.updateOne({_id: o_id},
      {$set: {password: newPassword, password_changed: 'true'}},
      (error, result)=>{
        if(result.result.ok !== 1 || result.modifiedCount !== 1){
          callback(Error("Non updated"));
        }else{
          callback(error);
        }
      });
  }

  /**
   * Updates the ConnectionState ("online" or "offline") of the login with the newConnectionState .
   * __callback example: function(error){}__
   * @param {String} id The id of the login
   * @param {String} newConnectionState The new ConnectionState to set for this login. 
   * @param {Callback} callback __callback example: function(error){}__ called with the result.
   */
  updateConnectionStateById(id, newConnectionState, callback){
    var o_id = new ObjectID(id);
    this.loginsCollection.updateOne({_id: o_id},
      {$set: {connection_state: newConnectionState}},
      (error, result)=>{
        if(result.result.ok !== 1 || result.modifiedCount !== 1){
          callback(Error("Non updated"));
        }else{
          callback(error);
        }
      });
  }

  /**
   * Updates the ConnectionState ("online" or "offline") of the login with the newConnectionState .
   * __callback example: function(error){}__
   * @param {String} id The id of the login
   * @param {String} newConnectionState The new ConnectionState to set for this login. 
   * @param {Callback} callback __callback example: function(error){}__ called with the result.
   */
  updateConnectionStateForAll(newConnectionState, callback){
    this.loginsCollection.updateMany({},
      {$set: {connection_state: newConnectionState}},
      (error, result)=>{
        if(result.result.ok !== 1 || result.modifiedCount === 0){
          callback(Error("Non updated"));
        }else{
          callback(error);
        }
      });
  }
}

module.exports = LoginsdDbCollection;