// models/Course.js
import { Model } from 'objection';
import Knex from '../dbConn.js';

const currentDate = new Date();
const formattedDate = currentDate.toISOString();

Model.knex(Knex);

class Course extends Model {
  static get tableName() {
    return 'IND_Courses';
  }

  static get idColumn() {
    return 'id';
  }
 
  static get courseSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        entitySectorId: { type: 'string' },
        uploadedDate: { type: 'string'},
        //contentLink: { type: 'string' },
        isDeleted: { type: 'string' },
        createdBy: { type: 'string' },
        image: { type: 'string' },
        //contentFile: { type: 'string' },
        courseImage: { type: 'string' },
      },
    };
  }
  $beforeInsert() {
    this.uploadedDate = new Date().toISOString();
  }
  static get relationMappings() {
    return {
      position: {
        relation: Model.BelongsToOneRelation,
        modelClass: Course,
        join: {
          from: 'IND_Courses.positionId',
          to: 'org_positions.id',
        },
      },
      entitySector: {
        relation: Model.BelongsToOneRelation,
        modelClass: Course,
        join: {
          from: 'IND_Courses.entitySectorId',
          to: 'org_entitysectors.id',
        },
      },
      createdByEmployee: {
        relation: Model.BelongsToOneRelation,
        modelClass: Course,
        join: {
          from: 'IND_Courses.createdBy',
          to: 'org_employees.id',
        },
      },
    };
  }
}

export default Course;
