import { Model } from 'objection';
import Knex from '../dbConn.js';
import Course from '../models/Course.js';
import Employee from '../models/Employee.js';
import Lesson from '../models/Lesson.js';


Model.knex(Knex);

class  Quiz extends Model {
    static get tableName() {
        return 'IND_Quizes';
    }

    static get idColumn() {
        return 'Id';
    }

    static get relationMappings() {
    /*     const IND_Courses = require('./IND_Courses');
        const IND_QuizTypes = require('./IND_QuizTypes');
        const IND_Lessons = require('./IND_Lessons');
        const org_employees = require('./org_employees');
 */
        return {
            course: {
                relation: Model.BelongsToOneRelation,
                modelClass: Course,
                join: {
                    from: 'IND_Quizes.courseId',
                    to: 'IND_Courses.id'
                }
            },
            quizType: {
                relation: Model.BelongsToOneRelation,
                //modelClass: IND_QuizTypes,
                join: {
                    from: 'IND_Quizes.quizTypeId',
                    to: 'IND_QuizTypes.Id'
                }
            },
            lesson: {
                relation: Model.BelongsToOneRelation,
                modelClass: Lesson,
                join: {
                    from: 'IND_Quizes.lessonId',
                    to: 'IND_Lessons.id'
                }
            },
            Employee: {
                relation: Model.BelongsToOneRelation,
                modelClass: Employee,
                join: {
                    from: 'IND_Quizes.createdBy',  
                    to: 'org_employees.id'
                }
            }
            }
        };
    }
export default Quiz;
