const ObjectID = require('mongodb').ObjectID;
const MongoClient = require('mongodb').MongoClient;

class GotosdDbCollection{

  /**
   * 
   * @param {MongoClient} dbClient 
   */
  constructor(dbClient){
    this.client = dbClient;
    const dbName = process.env['ATLAS_DB_NAME'];
    const gotosCollectionName = "gotos";
    this.gotosCollection = this.client.db(dbName).collection(gotosCollectionName);
    
    this.updateEventHandler = null;
    this.insertEventHandler = null;
    this.deleteEventHandler = null;

    this.gotosChangeStream = this.gotosCollection.watch();
    this.gotosChangeStream.on('change', next => {
      const operationType = next['operationType'];
      const documentKey = next['documentKey'];
      if(operationType === 'delete' && this.deleteEventHandler){
        this.deleteEventHandler(documentKey)
      }else if(operationType === 'insert' && this.insertEventHandler){
        const fullDocument = next['fullDocument'];
        this.insertEventHandler(documentKey, fullDocument);
      }else if((operationType === 'update' || operationType === 'replace') && this.updateEventHandler){
        const fullDocument = next['fullDocument'];
        this.updateEventHandler(documentKey, fullDocument);
      }
    });
  }

  /**
   * returns __true__ if connected to the _data base server_ otherwise __false__. 
   * @returns returns __true__ if connected to the _data base server_ otherwise __false__. 
   */
  isConnected(){
    return this.client.isConnected();
  }

  /**
   * Updates the status ("pending" | "done" | "canceled").
   * __callback example: function(error){}__
   * @param {String} id The id of the goto
   * @param {String} newStatus The new status to set for this goto. 
   * @param {Callback} callback __callback example: function(error){}__ called with the result.
   */
  updateStatusById(id, newStatus, callback){
    var o_id = new ObjectID(id);
    this.gotosCollection.updateOne({_id: o_id},
      {$set: {status: newStatus}},
      (error, result)=>{
        if(result.result.ok !== 1 || result.modifiedCount !== 1){
          callback(Error("Non updated"));
        }else{
          callback(error);
        }
      });
  }

  /**
   * Updates the location of the goto
   * @param {string} id 
   * @param {string} lat 
   * @param {string} longt 
   * @param {string} accuracy 
   * @param {CallableFunction} callback 
   */
  updateLocationById(id, lat, longt, acc, callback){
    var o_id = new ObjectID(id);
    this.gotosCollection.updateOne({_id: o_id},
      {$set: {latitude: lat, longitude: longt, accuracy: acc}},
      (error, result)=>{
        if(result.result.ok !== 1 || result.modifiedCount !== 1){
          callback(Error("Non updated"));
        }else{
          callback(error);
        }
      });
  }

  /**
   * Gets all pending gotos that are created in the past 2 hours.
   * @param {String} id The id of the courier 
   * @param {Callback} callback called with the result.
   */
  getRecentPendingGotosByCourierId(courierId, callback){
    const now_minus_two_hours = Date.now() - (3600 * 1000 * 2);
    console.log("courierId: ", courierId);
    this.gotosCollection 
    .find( {courier_id: courierId, status: "pending", start_time: {$gte: now_minus_two_hours}})
    .toArray((err, docs) => {  
      callback(err, docs);
    });
  }
}

module.exports = GotosdDbCollection;