// models/LessonContent.js

import { Model } from 'objection';
import Knex from '../dbConn.js'; 
import Lesson from './Lesson.js'; 

Model.knex(Knex);

class LessonContent extends Model {
    static get tableName() {
        return 'IND_lessonContent'; 
    }

    static get idColumn() {
        return 'id'; 
    }

    static get relationMappings() {
        
        return {
            lesson: {
                relation: Model.BelongsToOneRelation,
                modelClass: Lesson,
                join: {
                    from: 'IND_lessonContent.lessonId',
                    to: 'IND_Lessons.lessonId'
                }
            }
        };
    }
    static get jsonAttributes() {
        return ['content']; 
    }
}
export default LessonContent;
