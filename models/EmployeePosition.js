// models/EmployeePosition.js
import { Model } from 'objection';
import Knex from '../dbConn.js';


Model.knex(Knex);

class EmployeePosition extends Model {
  static get tableName() {
    return 'org_employeepositions';
  }

  static get idColumn() {
    return 'id';
  }
 
  static get relationMappings() {
    return {
      position: {
        relation: Model.BelongsToOneRelation,
        modelClass: EmployeePosition,
        join: {
          from: 'org_employeepositions.positionId',
          to: 'org_positions.id',
        },
      },
     
       Employee: {
        relation: Model.BelongsToOneRelation,
        modelClass: EmployeePosition,
        join: {
          from: 'org_employeepositions.employeeId',
          to: 'org_employees.id',
        },
      },
    };
  }
}

export default EmployeePosition;
