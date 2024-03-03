import { Model } from 'objection';
import Knex from '../dbConn.js'; 

Model.knex(Knex);

class Employee extends Model {
  static get tableName() {
    return 'ORG_Employees';
  }

  static get idColumn() {
    return 'id';
  }}
  export default Employee;