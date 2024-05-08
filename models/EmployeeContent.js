import { Model } from 'objection';
import Knex from '../dbConn.js'; 

Model.knex(Knex);


class EmployeeContent extends Model {
    static get tableName() {
      return 'IND_employeeContent'; 
    }
  
  static get idColumn() {
    return 'id';
  }
  }
  
  export default EmployeeContent;