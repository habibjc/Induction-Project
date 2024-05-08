import { Router, query } from 'express';
import Joi from 'joi';
import dbConn from '../dbConn.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Position from '../models/position.js';
import EmployeePosition from '../models/EmployeePosition.js';
import  CoursePositionAssignment from '../models/CoursePositionAssignment.js';
import LessonContent from '../models/LessonContent.js';
import authenticateToken from '../middleware/authent.js';
import authorizeRoles from '../middleware/author.js';
import EmployeeCourse from '../models/employeeCourse.js';
import { isNull } from 'underscore';

const router = Router();

////// INSERTS /////
// Add a new course
router.post('/addCourse', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const courseData = req.body;
  
    try {
      const { files } = req;
  
      // Validate course data
      const schema = Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        courseImage: Joi.string(),
      });
  
      const { error } = schema.validate(courseData);
      if (error) {
        throw new Error(error.details[0].message);
      }
 
      const { entitySectorId } = req.user;
  
      const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
      function generateRandomId() {
        return Math.floor(100 + Math.random() * 900);
      }

      const courseCount = generateRandomId();
      const id = `${entitySectorId}-${currentDate}${courseCount}`;
 
      courseData.id = id;
 
      courseData.isDeleted = '0';
  
      courseData.uploadedDate = new Date();
   
      if (files && files.courseImage) {
        const courseImageName = 'course_image_' + Date.now() + '_' + files.courseImage.name;
        files.courseImage.mv('uploadedCourses/' + courseImageName);
        courseData.courseImage = courseImageName;
      }
      const createdBy = req.user.userId;
      courseData.createdBy = createdBy;
      courseData.entitySectorId = entitySectorId;

      const newCourse = await Course.query().insert(courseData); // Assuming 'Course' is the correct model

  
      res.status(201).json(newCourse);
    } catch (error) {
      next(error);
    }
});

////// INSERTS /////
// Add a new lesson to a course
router.post('/courses/:courseId/addLesson', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const courseId = req.params.courseId;
    const lessonData = req.body;

    try {

      function generateRandomId() {
        return Math.floor(10 + Math.random() * 90);
      }
        const lessonCount = generateRandomId();
        const lessonId = `${courseId}${lessonCount}`;

        lessonData.id = lessonId; 
        lessonData.courseId = courseId; 

        const newLesson = await Lesson.query().insert(lessonData);

        res.status(201).json(newLesson);
    } catch (error) {
        next(error);
    }
});

////// INSERTS /////
// Add content to a lesson
router.post('/courses/:lessonId/addLessonContent', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const lessonId = req.params.lessonId;
    const lessonContentData = req.body;
    const files = req.files;

    try {
      function generateRandomId() {
        return Math.floor(10 + Math.random() * 90);
      }
        const lessonContentCount= generateRandomId();
        const id = `${lessonId}${lessonContentCount}`;

        lessonContentData.lessonId = lessonId;
        lessonContentData.id = id;

        if (files && files.flcontent) {
            const file = files.flcontent;
            const fileName = 'lesson_content_' + Date.now() + '_' + file.name;
            file.mv('uploadedLessonContent/' + fileName); 
            lessonContentData.flcontent = '/uploadedLessonContent/' + fileName;
        }

        const newLessonContent = await LessonContent.query().insert(lessonContentData);

        res.status(201).json(newLessonContent);
    } catch (error) {
        next(error);
    }
});

//// UPDATES /////
// Update a course by ID
router.put('/courses/update/:courseId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const courseId = req.params.courseId;
    const courseData = req.body;

    try {
        const existingCourse = await Course.query().findById(courseId);
        if (!existingCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const schema = Joi.object({
            title: Joi.string().required(),
            description: Joi.string().required(),
        });

        const { error } = schema.validate(courseData);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const updatedCourse = await Course.query().findById(courseId).patch(courseData);

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
        const existingLesson = await Lesson.query().findById(lessonId);
        if (!existingLesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        // Validate lesson data using Joi
        const schema = Joi.object({
            title: Joi.string().required(),
            description: Joi.string().required(),
        });

        const { error } = schema.validate(lessonData);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Update the lesson data in the database
        const updatedLesson = await Lesson.query().findById(lessonId).patch(lessonData);

        res.status(200).json({ message: 'Lesson Updated Successfully' });
    } catch (error) {
        next(error);
    }
});

// updating the lessoncontent
router.put('/lessoncontent/update/:contentId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const contentId = req.params.contentId;
    const updatedContentData = req.body;

    try {
        // Update the lesson content
        const updatedContent = await LessonContent.query().patchAndFetchById(contentId, updatedContentData);

        res.status(200).json(updatedContent);
    } catch (error) {
        next(error);
    }
});

/// RETRIEVALS ////

// Retrieve all courses
router.get('/viewcourses', authenticateToken, authorizeRoles(['EMPLOYEE', 'HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
      const courses = await Course.query()
  .where('isDeleted', 0)  
  .orderBy('uploadedDate', 'desc');

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

//New!!!
 // Retrieve a single course by ID
 router.get('/viewonecourse/:id', async (req, res, next) => {
  const courseId = req.params.id;

  try {
    const course = await Course.query().where('isDeleted', 0)  .findById(courseId);
    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ error: 'Course not found' });
    }
  } catch (error) {
    next(error);
  }
});

//New!!!
// Retrieving a specific lesson and its contents
router.get('/viewonelesson/:lessonId', authenticateToken, async (req, res, next) => {
  const lessonId = req.params.lessonId;

  try {

      const lesson = await Lesson.query()
          .findById(lessonId);

      if (!lesson) {
          return res.status(404).json({ error: 'Lesson not found' });
      }

      const contents =await  Lesson.query()
          .where('Id', lessonId);

      lesson.contents = contents;

      res.status(200).json(lesson.contents);
  } catch (error) {
      next(error);
  }
});

//New!!!!
// Route to display lesson content for a specific course
router.get('/courses/:courseId/lessonContent', async (req, res, next) => {
  try {

    const { courseId } = req.params;

    const lessons = await Lesson.query().where('courseId', courseId);

  
    for (const lesson of lessons) {

      lesson.contents = await LessonContent.query().where('lessonId', lesson.id);
    }

    res.json({ lessons });
  } catch (error) {

    next(error);
  }
});

//New
// Route to display lesson content for a specific lesson_content
router.get('/courses/:contentId/viewlessonContent', async (req, res, next) => {
  try {

    const { contentId } = req.params;

    const lessoncontents = await LessonContent.query().where('Id', contentId);
    if(lessoncontents.length>0)
    {
      res.json(lessoncontents);   
    }
    else
    {
      res.status(404).json({ error: 'No Record/s Found' });
    }

  } catch (error) {

    next(error);
  }
});

//New!!!
// Retrieve all lessons for a specific course
router.get('/courses/:lessonId/viewContentInLesson', async (req, res, next) => {
  const lessonId = req.params.lessonId;

  try {
      const contentslesson =await LessonContent.query().where('lessonId', lessonId);
      if(contentslesson.length>0)
      {
          res.json(contentslesson);  
      }
      else{
          res.status(404).json({ error: 'No contents available in this lesson' });
      }
   //   res.json(lessons);
  } catch (error) {
      next(error);
  }
});


// Retrieve all lessons for a specific course
router.get('/courses/:courseId/viewLessons', async (req, res, next) => {
  const courseId = req.params.courseId;

  try {
      const lessons =await Lesson.query().where('courseId', courseId);
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
// Your other retrieval routes...

//// DELETION OF OBJECTS //////
// Delete a course by ID
router.delete('/courses/delete/:id', authenticateToken, authorizeRoles(['ADMIN', 'HEAD_OF_UNIT']), async (req, res, next) => {
  const courseId = req.params.id;

  try {
      // Check if there are any lessons associated with the course
      const lessonsCount = await Lesson.query().where('courseId', courseId).resultSize();

      if (lessonsCount === 0) {
          // If there are no lessons associated, delete the course completely
          const deletedCourse = await Course.query().deleteById(courseId);

          if (deletedCourse) {
              res.json({ message: 'Course deleted successfully' });
          } else {
              res.status(404).json({ error: 'Course not found' });
          }
      } else {
          // If there are lessons associated, update the course by setting isDeleted to 1
          const updatedCourse = await Course.query().patch({ isDeleted: 1 }).findById(courseId);

          if (updatedCourse) {
              res.json({ message: 'Course deleted successfully' });
          } else {
              res.status(404).json({ error: 'Course not found' });
          }
      }
  } catch (error) {
      next(error);
  }
});

// Delete a lesson by ID
router.delete('/lessons/delete/:id', authenticateToken, authorizeRoles(['ADMIN', 'HEAD_OF_UNIT']), async (req, res, next) => {
    const lessonId = req.params.id;

    try {
      const lessonsContentCount = await LessonContent.query().where('lessonId',lessonId).resultSize();

      if (lessonsContentCount > 0) {
          // If there are lessons associated, inform the user
          res.status(400).json({ error: 'Cannot delete Lesson. It has associated content.' });
          return;
      }

        const deletedLesson = await Lesson.query().deleteById(lessonId);

        if (deletedLesson) {
            res.json({ message: 'Lesson deleted successfully' });
        } else {
            res.status(404).json({ error: 'Lesson not found' });
        }
    } catch (error) {
        next(error);
    }
});

// Delete a lesson content by ID
router.delete('/lessoncontents/delete/:id', authenticateToken, authorizeRoles(['ADMIN', 'HEAD_OF_UNIT']), async (req, res, next) => {
    const lessonContentId = req.params.id;

    try {
        const deletedLessonContent = await LessonContent.query().deleteById(lessonContentId);

        if (deletedLessonContent) {
            res.json({ message: 'Lesson Content deleted successfully' });
        } else {
            res.status(404).json({ error: 'Lesson Content not found' });
        }
    } catch (error) {
        next(error);
    }
});


// Assigning Course to Position

router.post('/assignCourse', authenticateToken, authorizeRoles(['HEAD_OF_UNIT', 'ADMIN', 'DEVELOPER']), async (req, res, next) => {
  try {
      const { courseId, positionId } = req.body; 
      const { userId } = req.user;

      // Call the stored procedure
      const result = await dbConn.raw('EXEC IND_AssignCourseToPosition ?, ?, ?', [courseId, positionId, userId]);

      // Check the result of the stored procedure
      if (result &&  result.length > 0) {
          const { message, error } = result[0];
          if (message) {
              // Course assigned successfully
              res.status(200).json({ message });
          } else if (error) {
              // Error occurred during assignment
              res.status(400).json({ error });
          } else {
              // Unexpected result
              res.status(500).json({ error: 'Unexpected result from stored procedure' });
          }
      } else {
          // No result or unexpected result
          res.status(500).json({ error: 'No result or unexpected result from stored procedure' });
      }
  } catch (error) {
      console.error('Error assigning course to position:', error);
      next(error);
  }
});

// Route to display courses for HR
router.get('/positions_in_institution/:positionId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res) => {
    try {
        // Get the positionId from the request parameters
        const positionId = req.params.positionId;
        const { entitySectorId } = req.user;
        // Query to retrieve courses for the specified position
        const query = `
            SELECT c.id,c.title,c.description,courseImage
            FROM IND_Courses c
            JOIN IND_positionCourses pc ON c.id = pc.courseId
            WHERE pc.positionID = ? AND c.isDeleted = 0 AND c.entitySectorId = ?
        `;

        // Execute the query to fetch courses
        const courses = await dbConn.raw(query, [positionId, entitySectorId]);
   if(courses.length === 0)
   {
    res.status(400).json({message:'No Courses found !!!'});
   }
   else{
        // Send the courses as a response
        res.json(courses); }
    } catch (error) {
        // Handle errors
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to display courses for employees

router.get('/courses_for_employeeposition/', authenticateToken, authorizeRoles(['EMPLOYEE','HR', 'DEVELOPER', 'ADMIN']), async (req, res) => {
    try {
        // Get the employeeId, entitySectorId, and positionId from the request user object
        const { userId, entitySectorId } = req.user;

        // Query to retrieve courses for the specified employee's position
        const query = `
            SELECT c.id,c.title,c.description,courseImage
            FROM IND_Courses c
            JOIN IND_positionCourses pc ON c.id = pc.courseId
            WHERE pc.positionId IN (
                SELECT positionId FROM ORG_employeepositions WHERE employeeId = ?
            ) AND c.isDeleted = 0 AND c.entitySectorId = ?
        `;

        // Execute the query to fetch courses
        const courses = await dbConn.raw(query, [userId, entitySectorId]);
        if(courses.length === 0)
        {
         res.status(400).json({message:'No Courses found !!!'});
        }
        else{
             // Send the courses as a response
             res.json(courses); }
    } catch (error) {
        // Handle errors
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

   //////////// Enrolling in a course /////////////////
   ///////////////////////////////////////////////////
   router.post('/enrollCourse/:courseId', authenticateToken, authorizeRoles(['EMPLOYEE','HEAD_OF_UNIT', 'ADMIN', 'DEVELOPER']), async (req, res) => {
    const { userId } = req.user; 
    const { courseId } = req.params;

    try {
        console.log('User ID:', userId);
        console.log('Course ID:', courseId);

        // Check if the user has another course in progress
        const existingCourse = await EmployeeCourse.query()
        .where('statusId', '<>', 4)
        .andWhere('userId', '=', userId)
        .andWhere('endDate', null)
        .select('courseId');
        console.log('Existing Course:', existingCourse);

        if (existingCourse.length > 0) {
            res.status(400).json({ error: 'You already have another course in progress.' });
            return;
        }

        const enrollment = {
            id: `${courseId}-${userId}`,
            UserId: userId,
            CourseId: courseId,
            StatusId: 2, 
            StartDate: new Date(), 
            EndDate: null 
        };
        
        await EmployeeCourse.query().insert(enrollment);

        res.status(200).json({ message: 'Enrolled.',new:date() });
    } catch (error) {
        console.error('An error occurred while enrolling employee in course:', error);
        res.status(500).json({ error: 'An error occurred while enrolling employee in course. Please try again.' });
    }
});

/////// User Course Details Display from a list of courses in his position /////////
///////////////////////////////////////////////////////////////////////////////////
router.get('/courseDetails/:courseId', authenticateToken, authorizeRoles(['EMPLOYEE','HEAD_OF_UNIT', 'ADMIN', 'DEVELOPER']),async (req, res) => {
    const { courseId } = req.params;

    try {
        // Retrieve course details
        const courseDetails = await dbConn('IND_Courses')
            .select('id as courseId', 'title as courseTitle', 'description as courseDescription')
            .where('id', courseId)
            .first();

        if (!courseDetails) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        // Retrieve lessons for the course
        const lessons = await dbConn('IND_Lessons')
            .select('id as lessonId', 'title as lessonTitle', 'description as lessonDescription')
            .where('courseId', courseId);

        // Retrieve final quiz for the course
        const finalQuiz = await dbConn('IND_Quizes')
    .select('id as quizId') // Assuming there's an `id` column in IND_Quizes
    .where({
        courseId,
        quizTypeId: 2
    })
    .first();

// Construct the final quiz object with the label
const finalQuizObject = finalQuiz ? { quizId: finalQuiz.quizId, quizTitle: 'Final Quiz' } : null;


        // Construct the response object
        const courseDetailsResponse = {
            courseTitle: courseDetails.courseTitle,
            courseDescription: courseDetails.courseDescription,
            lessons: lessons.map(lesson => ({
                lessonId: lesson.lessonId,
                lessonTitle: lesson.lessonTitle,
                lessonDescription: lesson.lessonDescription
            })),
            finalQuiz: finalQuiz ? {
                quizId: finalQuiz.quizId,
                quizTitle: finalQuiz.quizTitle
            } : null
        };
        

        res.status(200).json(courseDetailsResponse);
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ error: 'An error occurred while fetching course details.' });
    }
});

/////// User Lesson Details Display from a list of Lessons in his selected courseDetails /////////
/////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/lessonDetails/:lessonId', authenticateToken, authorizeRoles(['EMPLOYEE','HEAD_OF_UNIT', 'ADMIN', 'DEVELOPER']),async (req, res) => {
    const { lessonId } = req.params;
    
        try {
            // Retrieve lesson details
            const lessonDetails = await dbConn('IND_Lessons')
                .select('id as lessonId', 'title as lessonTitle', 'description as lessonDescription')
                .where('id', lessonId)
                .first();
    
            if (!lessonDetails) {
                return res.status(404).json({ error: 'Lesson not found.' });
            }
    
            // Retrieve lesson contents for the lesson
            lessonDetails.lessonContents = await dbConn('IND_LessonContent')
                .select('id', 'title', 'txtContent', 'flContent')
                .where('lessonId', lessonId);
    
            // Retrieve quizzes associated with the lesson
            lessonDetails.quizzes = await dbConn('IND_Quizes')
                .select('id', dbConn.raw("'Self-Evaluation' as title"))
                .where({
                    lessonId: lessonId,
                    quizTypeId: 1 // Assuming quizTypeId 1 is for quizzes associated with lessons
                });
    
            // Construct the response object
            const lessonDetailsResponse = {
                lessonTitle: lessonDetails.lessonTitle,
                lessonDescription: lessonDetails.lessonDescription,
                lessonContents: lessonDetails.lessonContents,
                quizzes: lessonDetails.quizzes
            };
    
            res.status(200).json(lessonDetailsResponse);
        } catch (error) {
            console.error('Error fetching lesson details:', error);
            res.status(500).json({ error: 'An error occurred while fetching lesson details.' });
        }
    });
    

export default router;
