import { Model } from 'objection';
import Knex from '../dbConn.js';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';

Model.knex(Knex);

class  quizQuestion extends Model {
    static get tableName() {
        return 'IND_quizQuestions';
    }

    static get idColumn() {
        return 'id';
    }

    static get relationMappings() {
      /*   const IND_Quizes = require('./IND_Quizes');
        const IND_Questions = require('./IND_Questions');
 */
        return {
            quiz: {
                relation: Model.BelongsToOneRelation,
                modelClass:  Quiz,
                join: {
                    from: 'IND_quizQuestions.quizId',
                    to: 'IND_Quizes.Id'
                }
            },
            question: {
                relation: Model.BelongsToOneRelation,
                modelClass: Question,
                join: {
                    from: 'IND_quizQuestions.questionId',
                    to: 'IND_Questions.Id'
                }
            }
        };
    }
}

export default quizQuestion;
