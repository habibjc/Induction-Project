// models/UserEntitySector.js
import { Model } from 'objection';
import Knex from '../dbConn.js';

Model.knex(Knex);

class UserEntitySector extends Model {
  static get tableName() {
    return 'USR_UserEntitySectors';
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'USR_UserEntitySectors.userId',
          to: 'usr_users.id',
        },
      },
      // Add any other relationships needed
    };
  }
}

export default UserEntitySector;
