// models/User.js
import { Model } from 'objection';
import Knex from '../dbConn.js';
//import bcrypt from 'bcrypt';

Model.knex(Knex);

class Position extends Model {
  static get tableName() {
    return 'org_positions';
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      positions: {
        relation: Model.HasManyRelation,
        modelClass: Position,
        join: {
          from: 'org_positions.unitId',
          to: 'org_units.id',
        },
      },
      // Add any other relationships needed
    };}
    
  }

export default Position;
