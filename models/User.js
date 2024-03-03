// models/User.js
import { Model } from 'objection';
import Knex from '../dbConn.js';
import { compareSync } from 'bcrypt';
import UserEntitySector from './UserEntitySector.js';

Model.knex(Knex);

class User extends Model {
  static get tableName() {
    return 'usr_users';
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      entitySectors: {
        relation: Model.HasManyRelation,
        modelClass: UserEntitySector,
        join: {
          from: 'usr_users.id',
          to: 'USR_UserEntitySectors.userId',
        },
      },
      // Add any other relationships needed
    };}
    verifyPassword(password) {
    return compareSync(password, this.password);}
  }

export default User;
