const ObjectID = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;

class ClientsLocationsdDbCollection{

  /**
   * 
   * @param {MongoClient} dbClient 
   */
  constructor(dbClient){
    this.client = dbClient;
    const dbName = process.env['ATLAS_DB_NAME'];
    const collectionName = "clients_locations";
    this.collection = this.client.db(dbName).collection(collectionName);
  }

  /**
   * returns __true__ if connected to the _data base server_ otherwise __false__. 
   * @returns returns __true__ if connected to the _data base server_ otherwise __false__. 
   */
  isConnected(){
    return this.client.isConnected();
  } 

  /**
   * Updates the location of the goto
   * @param {string} phoneNumber 
   * @param {string} lat 
   * @param {string} longt 
   * @param {string} accuracy 
   * @param {CallableFunction} callback 
   */
  updateLocationByPhoneNumber(phoneNumber, lat, longt, acc, callback){
    this.collection.updateOne({phone: phoneNumber},
      {$set: {latitude: lat, longitude: longt, accuracy: acc}},
      (error, result)=>{
        if(result.result.ok !== 1 || result.modifiedCount !== 1){
          callback(Error("Non updated"));
        }else{
          callback(error);
        }
      });
  }

  
}

module.exports = ClientsLocationsdDbCollection;