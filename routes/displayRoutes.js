import { Router, query } from 'express';
import Joi from 'joi';
import dbConn from '../dbConn.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import EmployeeContent from '../models/EmployeeContent.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import  CoursePositionAssignment from '../models/CoursePositionAssignment.js';
import LessonContent from '../models/LessonContent.js';
import authenticateToken from '../middleware/authent.js';
import authorizeRoles from '../middleware/author.js';
import EmployeeCourse from '../models/employeeCourse.js';
import { isNull } from 'underscore';

const router = Router();

router.get('/inductionprogress', authenticateToken, authorizeRoles(['HR', 'INDUCTION_OVERSIGHT', 'DEVELOPER', 'ADMIN']), async (req, res) => {
    try {
        const part = 'inductees_progress';
        const { fiscalyear } = req.query;
          
        if (!fiscalyear) {
            throw new Error('Fiscal year is missing');
        }
        const sqlQuery = `EXEC IND_GetInductionProgressData @part = ?, @fiscalyear = ?`;
        const inducteesData = await dbConn.raw(sqlQuery, [part, fiscalyear]);
        res.json(inducteesData);
    } catch (error) {
        console.error('Error retrieving inductees data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Route for all other data
router.get('/inductees_list/:entitysectorId', authenticateToken, authorizeRoles(['EMPLOYEE', 'INDUCTION_OVERSIGHT', 'DEVELOPER', 'ADMIN']), async (req, res) => {
    try {
        const { fiscalyear } = req.query;
          
        if (!fiscalyear) {
            throw new Error('Fiscal year is missing');
        }
        const { entitysectorId } = req.params; 
        console.log('Fiscal Year:', fiscalyear);
        console.log('Entity Sector Id:', entitysectorId);
        const part = 'inductees_list'; // Specify the part of the stored procedure to execute
        const otherData = await dbConn.raw('EXEC IND_GetInductionProgressData @part = ?, @fiscalyear = ?, @entitysectorId = ?', [part, fiscalyear, entitysectorId]);
        res.json(otherData);
    } catch (error) {
        console.error('Error retrieving other data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

////////////////////////////////Progress Monitoring at Institution Level//////////////////////////////////
router.get('/inductionprogress-institution-level', authenticateToken, authorizeRoles(['HR', 'INDUCTION_OVERSIGHT', 'DEVELOPER', 'ADMIN']), async (req, res) => {
    try {
        const part = 'inductees_progress_institution_level';
        const { fiscalyear } = req.query;
        const entity = req.user.entitySectorId;
        console.log(fiscalyear);
        if (!fiscalyear) {
            throw new Error('Fiscal year is missing');
        }
        const sqlQuery = `EXEC IND_GetInductionProgressData @part = ?, @fiscalyear = ?, @entity = ?`;
        const inducteesData = await dbConn.raw(sqlQuery, [part, fiscalyear, entity]);
        res.json(inducteesData);
    } catch (error) {
        console.error('Error retrieving inductees data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}); 

////////////////////////////////Progress Monitoring at Institution Level//////////////////////////////////
router.get('/inductionprogress-institution-level/:unitId', authenticateToken, authorizeRoles(['HR', 'INDUCTION_OVERSIGHT', 'DEVELOPER', 'ADMIN']), async (req, res) => {
    try {
        const part = 'inductees_progress_institution_level_unit';
        const { fiscalyear } = req.query;
        const entity = req.user.entitySectorId;
        const unit = req.params.unitId;
        console.log(fiscalyear);
        console.log(entity);
        console.log(unit);
        if (!fiscalyear) {
            throw new Error('Fiscal year is missing');
        }
        const sqlQuery = `EXEC IND_GetInductionProgressData @part = ?, @fiscalyear = ?, @entity = ?, @unit = ? `;
        const inducteesData = await dbConn.raw(sqlQuery, [part, fiscalyear, entity, unit]);
        res.json(inducteesData);
    } catch (error) {
        console.error('Error retrieving inductees data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}); 

  export default router;