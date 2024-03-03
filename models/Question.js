import { Model } from 'objection';
import Knex from '../dbConn.js';

Model.knex(Knex);

class Question extends Model {
    static get tableName() {
        return 'IND_Questions';
    }

    static get idColumn() {
        return 'Id';
    }
}

export default Question;
