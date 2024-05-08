import { Model } from 'objection';
import Knex from '../dbConn.js'; 

Model.knex(Knex);


class Notification extends Model {
    static get tableName() {
      return 'COM_Notifications'; 
    }
  
  static get idColumn() {
    return 'id';
  }
  }
  
  export default Notification;