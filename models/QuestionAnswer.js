import { Model } from 'objection';
import Knex from '../dbConn.js';
import Question from '../models/Question.js';

Model.knex(Knex);

class QuestionAnswer extends Model {
    static get tableName() {
        return 'IND_questionAnswers';
    }

    static get idColumn() {
        return 'Id';
    }

    static get relationMappings() {
       // const IND_Questions = require('./IND_Questions');
        return {
            question: {
                relation: Model.BelongsToOneRelation,
                modelClass: Question,
                           join: {
                    from: 'IND_questionAnswers.questionId',
                    to: 'IND_Questions.Id'
                }
            }
        };
    }
}

export default QuestionAnswer;
