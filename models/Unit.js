// Unit.js
import { Model } from 'objection';
import Knex from '../dbConn.js';
import Position from './position.js'; 

Model.knex(Knex);

class Unit extends Model {
  static get tableName() {
    return 'ORG_units';  
  }

  static get idColumn() {
    return 'id';  
  }

   static get relationMappings() {
    return {
      Position: {
        relation: Model.BelongsToOneRelation, 
        modelClass: Position,
        join: {
          from: 'org_Units.id',
          to: 'org_positions.unitId',
        },
      },
      // Add any other relationships needed
    };}
}

export default Unit;
