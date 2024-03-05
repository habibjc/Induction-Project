import { Model } from 'objection';
import Knex from '../dbConn.js';

Model.knex(Knex);

class CoursePositionAssignment extends Model {
  static get tableName() {
    return 'IND_positionCourses';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['courseId', 'positionId'],
      properties: {
        id: { type: 'integer' },
        courseId: { type: 'string', maxLength: 46 },
        positionId: { type: 'string', maxLength: 35 },
      }
    };
  }

  static get relationMappings() {
    return {
      course: {
        relation: Model.BelongsToOneRelation,
        modelClass:'/Course', // Adjust the path as needed
        join: {
          from: 'IND_positionCourses.courseId',
          to: 'IND_Courses.id',
        },
      },
      position: {
        relation: Model.BelongsToOneRelation,
        modelClass:'/Position', // Adjust the path as needed
        join: {
          from: 'IND_positionCourses.positionID',
          to: 'org_positions.id',
        },
      },
    };
  }
}

export default CoursePositionAssignment;
