// models/UserEntitySectorRole.js
import { Model } from 'objection';
import Knex from '../dbConn.js';
import UserEntitySector from './UserEntitySector.js';

Model.knex(Knex);

class UserEntitySectorRole extends Model {
  static get tableName() {
    return 'USR_UserEntitySectorRoles';
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      userEntitySector: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserEntitySector,
        join: {
          from: 'USR_UserEntitySectorRoles.userEntitySectorId',
          to: 'USR_UserEntitySectors.id',
        },
      },
      // Add any other relationships needed
    };
  }
}

export default UserEntitySectorRole;
