// models/position.js
import { Model } from 'objection';
import Knex from '../dbConn.js';
import Unit from './Unit.js'; // Import the Unit model

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
      unit: {
        relation: Model.BelongsToOneRelation,
        modelClass: Unit,
        join: {
          from: 'org_positions.unitId',
          to: 'ORG_units.id'
        }
      }
      // Add other relation mappings as needed
    };
  }
}

export default Position;
