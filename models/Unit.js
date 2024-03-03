import { Model } from 'objection';
import Knex from '../dbConn.js'; 

Model.knex(Knex);

class Unit extends Model {
  static get tableName() {
    return 'ORG_units';
  }

  static get idColumn() {
    return 'id';
  }}
  export default Unit;