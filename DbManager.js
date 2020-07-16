const ObjectID = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;

class DbManager{
  constructor(){
    //TODO: set it to env var.
    const dbUsername = process.env['ATLAS_DB_USERNAME'];
    const dbPassword = process.env['ATLAS_DB_PASSWORD'];
    const uri = `mongodb+srv://${dbUsername}:${dbPassword}@cluster-ishbilia.oskgm.mongodb.net?retryWrites=true&w=majority&tls=true`;  
    this.client = new MongoClient(uri, { useUnifiedTopology: true, tls: true});
    this.loginsCollection = null;
  }
  /**
   * Connects to the _Db server_ and calls the callback upon finishing.
   * __Eg: callback(error)__
   * @param {Callback} callback called with an error arg in case of an error. 
   */
  connect(callback){
    this.client.connect( err => {
        if(!err){
          //TODO: set it to env var.
          const dbName = process.env['ATLAS_DB_NAME'];
          const loginsCollectionName = "logins";
          this.loginsCollection = this.client.db(dbName).collection(loginsCollectionName);
        }  
        callback(err)
      }
    );
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
      { projection: { _id: 1, username: 1, roles: 1}},
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

}

module.exports = DbManager;