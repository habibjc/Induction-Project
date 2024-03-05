// models/Lesson.js
import { Model } from 'objection';
import Knex from '../dbConn.js';
import Course from './Course.js';

Model.knex(Knex);

class Lesson extends Model {
    static get tableName() {
        return 'IND_Lessons'; // Name of your lessons table
    }

    static get idColumn() {
        return 'id'; // Primary key column name
    }

    static get relationMappings() {
       
        return {
            course: {
                relation: Model.BelongsToOneRelation,
                modelClass: Course,
                join: {
                    from: 'IND_Lessons.courseId',
                    to: 'IND_Courses.id'
                }
            }
        };
    }
}

export default Lesson;
