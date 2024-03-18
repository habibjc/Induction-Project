// models/position.js
import { Model } from 'objection';
import Knex from '../dbConn.js';
import Course from './Course.js'; // Import the Unit model

Model.knex(Knex);

class EmployeeCourse extends Model {
  static get tableName() {
    return 'IND_EmployeeCourse';
  }

  static get idColumn() {
    return 'id';
  }

  static get relationMappings() {
    return {
      Course: {
        relation: Model.BelongsToOneRelation,
        modelClass: Course,
        join: {
          from: 'IND_EmployeeCourse.courseId',
          to: 'IND_Courses.id'
        }
      }
      // Add other relation mappings as needed
    };
  }
}

export default EmployeeCourse;
