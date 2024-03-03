// routes/coursesRoutes.js
import { Router } from 'express';
const router = Router();
//import Course from '../models/Course.js';
import Joi from 'joi';
import dbConn from '../dbConn.js';
//import EmployeePosition from '../models/EmployeePosition'; 
//import Position from '../models/position';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import LessonContent from '../models/LessonContent.js';
//import UserEntitySector from '../models/UserEntitySector';
//import errorHandler from '../middleware/errorHandler';
import authenticateToken from '../middleware/authent.js';
import authorizeRoles from '../middleware/author.js';
//import fs from 'fs';

////// INSERTS /////
// Add a new course
router.post('/addCourse', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const courseData = req.body;
  
    try {
      const { files } = req;
  
      // Validate course data
      const schema = object({
        title: string().required(),
        description: string().required(),
        courseImage: string(),
  
      });
  
      const { error } = schema.validate(courseData);
      if (error) {
        throw new Error(error.details[0].message);
      }
 
      const { entitySectorId } = req.user;
  
      const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
   
      function generateRandomId() {
        // Generate a random number between 1000000000 and 9999999999 (inclusive)
        return Math.floor(10000 + Math.random() * 90000);
            }
      const courseCount =  generateRandomId() ;
      const id = `${entitySectorId}-${currentDate}-${courseCount}`;
 
      courseData.id = id;
 
      courseData.isDeleted = '0';
  
      courseData.uploadedDate = new Date();
  
      if (files && files.image) {
        const imageName = 'course_image_' + Date.now() + '_' + files.image.name;
        files.image.mv('uploadedCourses/' + imageName);
        courseData.image = '/uploadedCourses/' + imageName;
      }
  
      if (files && files.courseImage) {
        const courseImageName = 'course_image_' + Date.now() + '_' + files.courseImage.name;
        files.courseImage.mv('uploadedCourses/' + courseImageName);
        courseData.courseImage = courseImageName;
      }
      const createdBy = req.user.userId;
      courseData.createdBy = createdBy;
      courseData.entitySectorId = entitySectorId;
      const newCourse = await  query().insert(courseData);
  
      res.status(201).json(newCourse);
    } catch (error) {
      next(error);
    }
  });
  

router.post('/courses/:courseId/addLesson', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const courseId = req.params.courseId;
    const lessonData = req.body;

    try {
   
        const lessonCount = await  _query().where('courseId', courseId).resultSize();
        const lessonId = `${courseId}-0${lessonCount + 1}`;

        lessonData.id = lessonId; 
        lessonData.courseId = courseId; 

        const newLesson = await  _query().insert(lessonData);

        res.status(201).json(newLesson);
    } catch (error) {
        next(error);
    }
});


// Add content to a lesson
router.post('/courses/:lessonId/addLessonContent', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const lessonId = req.params.lessonId;
    const lessonContentData = req.body;
    const files = req.files;

    try {
      
        const lessonContentCount = await __query()
            .where('lessonId', lessonId)
            .resultSize();

       
        const id = `${lessonId}-0${lessonContentCount + 1}`;

    
        lessonContentData.lessonId = lessonId;
        lessonContentData.id = id;

     
        if (files && files.flcontent) {
            const file = files.flcontent;
            const fileName = 'lesson_content_' + Date.now() + '_' + file.name;
            file.mv('uploadedLessonContent/' + fileName); 
            lessonContentData.flcontent = '/uploadedLessonContent/' + fileName;
        }

         const newLessonContent = await __query().insert(lessonContentData);

        res.status(201).json(newLessonContent);
    } catch (error) {
        next(error);
    }
});

  //// UPDATES /////

  router.put('/courses/update/:courseId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const courseId = req.params.courseId;
    const courseData = req.body;

    try {
  
        const existingCourse = await query().findById(courseId);
        if (!existingCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }


        const schema = object({
            title: string().required(),
            description: string().required(),
                   });

        const { error } = schema.validate(courseData);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        
        const updatedCourse = await query().findById(courseId).patch(courseData);

        res.status(200).json({ message: 'Course Updated Successfully' });
    } catch (error) {
        next(error);
    }
});


// updating the lesson's title and description
router.put('/lessons/update/:lessonId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const lessonId = req.params.lessonId;
    const lessonData = req.body;

    try {
        // Check if the lesson exists
        const existingLesson = await _query().findById(lessonId);
        if (!existingLesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        // Validate lesson data using Joi
        const schema = object({
            title: string().required(),
            description: string().required(),
            
        });

        const { error } = schema.validate(lessonData);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Update the lesson data in the database
        const updatedLesson = await _query().findById(lessonId).patch(lessonData);

        res.status(200).json({ message: 'Lesson Updated Successfully' });
    } catch (error) {
        next(error);
    }
});
// updating the lessoncontent
router.get('/lessoncontent/:contentId/edit',authenticateToken, async (req, res, next) => {
    const contentId = req.params.contentId;

    try {
        // Retrieve existing lesson content
        const existingContent = await __query()
            .findById(contentId);

        if (!existingContent) {
            return res.status(404).json({ error: 'Lesson content not found' });
        }

        // Render a form with the existing content
        res.status(200).json(existingContent);
    } catch (error) {
        next(error);
    }
});
const lessonContentSchema = Joi.object({
  title: Joi.string().required(),
});

router.put('/lessoncontent/update/:contentId',authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']),async (req, res, next) => {
    const contentId = req.params.contentId;
    const updatedContentData = req.body;

    try {
        // Update the lesson content
        const updatedContent = await __query()
            .patchAndFetchById(contentId, updatedContentData);

        res.status(200).json(updatedContent);
    } catch (error) {
        next(error);
    }
});

/// RETRIEVALS ////
// Retrieve all courses
router.get('/viewcourses', authenticateToken, authorizeRoles(['EMPLOYEE','HR', 'DEVELOPER','ADMIN']), async (req, res, next) => {
  
     try {
         const courses = await query();
         res.json(courses);
     } catch (error) {
         next(error);
     }
 });

 router.get('/positionsOfLoggedUser', authenticateToken, authorizeRoles(['ADMIN', 'HEAD_OF_UNIT']), async (req, res, next) => {
     try {
        
         const userId = req.user.userId;
 
         const positions = await dbConn.raw('EXEC IND_GetPositionsForLoggedUser @userId = ?', [userId]);
 
         res.json(positions);
     } catch (error) {
         next(error);
     }
 });
 
 // Retrieve a single course by ID
 router.get('/courses/:id', async (req, res, next) => {
   const courseId = req.params.id;
 
   try {
     const course = await query().findById(courseId);
     if (course) {
       res.json(course);
     } else {
       res.status(404).json({ error: 'Course not found' });
     }
   } catch (error) {
     next(error);
   }
 });
 

// Retrieving a specific lesson and its contents
router.get('/lessons/:lessonId', authenticateToken, async (req, res, next) => {
    const lessonId = req.params.lessonId;

    try {
  
        const lesson = await _query()
            .findById(lessonId);

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        const contents = await __query()
            .where('lessonId', lessonId);

        lesson.contents = contents;

        res.status(200).json(lesson);
    } catch (error) {
        next(error);
    }
});


// Retrieve all lessons for a specific course
router.get('/courses/:courseId/viewLessons', async (req, res, next) => {
    const courseId = req.params.courseId;

    try {
        const lessons = await _query().where('courseId', courseId);
        if(lessons.length>0)
        {
            res.json(lessons);  
        }
        else{
            res.status(404).json({ error: 'No Lessons available' });
        }
     //   res.json(lessons);
    } catch (error) {
        next(error);
    }
});

// Route to display lesson content for a specific course
router.get('/courses/:courseId/lessons', async (req, res, next) => {
    try {

      const { courseId } = req.params;

      const lessons = await _query().where('courseId', courseId);
  
    
      for (const lesson of lessons) {
  
        lesson.contents = await __query().where('lessonId', lesson.id);
      }
  
      res.json({ lessons });
    } catch (error) {
  
      next(error);
    }
  });


  ////   DELETION OF OBJECTS //////
  
// Delete a course by ID
router.delete('/courses/delete/:id', authenticateToken, authorizeRoles(['ADMIN', 'HEAD_OF_UNIT']),async (req, res, next) => {
    const courseId = req.params.id;
  
    try {
      const deletedCourse = await query().deleteById(courseId);
  
      if (deletedCourse) {
        res.json({ message: 'Course deleted successfully' });
      } else {
        res.status(404).json({ error: 'Course not found' });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Delete a lesson by ID
router.delete('/lessons/delete/:id', authenticateToken, authorizeRoles(['ADMIN', 'HEAD_OF_UNIT']),async (req, res, next) => {
    const lessonId = req.params.id;
  
    try {
      const deletedLesson = await _query().deleteById(lessonId);
  
      if (deletedLesson) {
        res.json({ message: 'Lesson deleted successfully' });
      } else {
        res.status(404).json({ error: 'Lesson not found' });
      }
    } catch (error) {
      next(error);
    }
  });

  // Delete a lesson by ID
router.delete('/lessoncontents/delete/:id', authenticateToken, authorizeRoles(['ADMIN', 'HEAD_OF_UNIT']), async (req, res, next) => {
    const lessonContentId = req.params.id;
  
    try {
      const deletedLessonContent = await __query().deleteById(lessonContentId);
  
      if (deletedLessonContent) {
        res.json({ message: 'Lesson Content deleted successfully' });
      } else {
        res.status(404).json({ error: 'Lesson Content not found' });
      }
    } catch (error) {
      next(error);
    }
  });
export default router;
