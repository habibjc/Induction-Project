import { Router } from 'express';
import ExcelJS from 'exceljs';
import dbConn from '../dbConn.js';
import Course from '../models/Course.js';
import authenticateToken from '../middleware/authent.js';
import authorizeRoles from '../middleware/author.js';
import { isNull } from 'underscore';

const router = Router();

router.post('/addNewQuiz/:courseId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const {quizTypeId, lessonId } = req.body;
        // Validate courseId here

        // Check if file is uploaded
        if (!req.files || !req.files.quizExcel) {
            return res.status(400).json({ error: 'No Excel file uploaded' });
        }

        // Read the file from the request stream
        const file = req.files.quizExcel;

        // Load the workbook from the uploaded Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.data);

        // Validate courseId
        const course = await Course.query().findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Create a new quiz record in the database
        const quizId1 = generateRandomId();
        const quizId = quizId1.toString();
        const createdOn = new Date();
        const createdOnString = createdOn.toISOString();
        const createdBy = req.user.userId;
        const meth = 'uploaded';
/*         const quizTypeId = req.body;
        const lessonId = req.body; */

        // Call function to upload quiz data
        const result =  await uploadQuizData(workbook, courseId, quizId, quizTypeId,lessonId, createdOnString, createdBy,meth, res);
        // Check if any questions were skipped
        if (result && result.skipped) {
            return res.status(400).json({ error: 'Sorry, there are Similar questions, Upload Failed !!! Contact Support team' });
        }

        // Respond with success message
        res.status(200).json({ message: 'Questions uploaded successfully !!!' });
   
    } catch (error) {
        // Handle errors
        console.error('Error while adding quiz:', error);
        next(error);
    }
});
async function uploadQuizData(workbook, courseId, quizId, quizTypeId,lessonId, createdOnString, createdBy,meth, res) {
    try {
        // Check if the user has existing questions in IND_tempQuestions
        const existingQuestions = await dbConn('IND_tempQuestions').where('createdBy', createdBy);
        if (existingQuestions.length > 0) {
            return res.status(400).json({ error: 'You have existing questions in IND_tempQuestions. Please confirm or cancel those questions before uploading new ones.' });
        }

        const worksheet = workbook.getWorksheet(1); // Assuming the first worksheet is used
        const questions = [];

        worksheet.eachRow(async (row, rowNumber) => {
            if (rowNumber !== 1) { // Skip the header row
                const [, description, optionA, optionB, optionC, optionD, answer, marks] = row.values;

                // Convert marks to a number
                const marksNumber = parseInt(marks);

                // Check if marksNumber is a valid number
                if (!isNaN(marksNumber)) {
                    questions.push({ description, optionA, optionB, optionC, optionD, marks: marksNumber, answer,meth });
                } else {
                    //  console.error('Invalid Value for Marks:', marks);
                    return;
                }
            }
        });

        // Insert questions into the database
        const skippedQuestions = await Promise.all(questions.map(question =>
            addTempInductionQuestion(question.description, question.optionA, question.optionB, question.optionC, question.optionD, question.marks,question.answer,  quizId, quizTypeId,lessonId, courseId, createdOnString, createdBy,meth)
        ));

        // Check if any questions were skipped
        const anySkipped = skippedQuestions.some(question => question.skipped);

        // Return a value indicating whether any questions were skipped
        return { skipped: anySkipped };
    } catch (error) {
        console.error('Error while uploading quiz questions:', error.message);
        throw error; // Throw error to be caught by the calling function
    }
}

///// INSERTING DATA IN TEMP QUESTIONS FROM FORM ///////////

router.post('/addNewQuizFromForm/:courseId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        const {quizTypeId, lessonId } = req.body;
        // Validate lessonId, quizTypeId, and question data
        if (!req.body.description || !req.body.optionA || !req.body.optionB || !req.body.optionC || !req.body.optionD || !req.body.marks || !req.body.answer) {
            return res.status(400).json({ error: 'Incomplete or invalid form data' });
        }

        // Create a new quiz record in the database
        const quizId = generateRandomId();
        const createdOnString = new Date().toISOString();
        const createdBy = req.user.userId;
        const meth = 'typed';
        // Process the single question
        try {
            const { description, optionA, optionB, optionC, optionD, marks, answer } = req.body;

            // Insert question into the database using common quiz information
            const result = await addTempInductionQuestion(description, optionA, optionB, optionC, optionD, marks, answer, quizId, quizTypeId, lessonId, courseId, createdOnString, createdBy,meth);

            if (result.skipped) {
                return res.status(400).json({ error: 'Failed to add question' });
            } else {
                // If question added successfully, return success response
                return res.status(200).json({ message: 'Question added successfully' });
            }
        } catch (error) {
            console.error('Error adding question:', error.message);
            return res.status(500).json({ error: 'Internal server error' });
        }
    } catch (error) {
        console.error('Error adding new quiz from form:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

///// END OF INSERTING DATA IN TEMP QUESTIONS FROM FORM AFTER ENTERING THE LAST, USER HAS TO VIEW THEM AND SELECT LESSON AND QUIZTYPE FOR INSERTING THEM///////////
async function addTempInductionQuestion(description, optionA, optionB, optionC, optionD, marks, answer, quizId, quizTypeId,lessonId, courseId, createdOnString, createdBy,meth, req) {
    try {
       
             // Stringify JSON data
             const descriptionString = typeof description === 'object' ? JSON.stringify(description) : String(description);
             const optionAString = typeof optionA === 'object' ? JSON.stringify(optionA) : String(optionA);
             const optionBString = typeof optionB === 'object' ? JSON.stringify(optionB) : String(optionB);
             const optionCString = typeof optionC === 'object' ? JSON.stringify(optionC) : String(optionC);
             const optionDString = typeof optionD === 'object' ? JSON.stringify(optionD) : String(optionD);
             
     // Check if a similar question already exists (uploaded by a different user)
        const existingQuestion = await dbConn('IND_tempQuestions')
            .where({
                description: descriptionString
            })
            .first();

        if (existingQuestion) {
            console.log('Sorry, some of these questions exist in temporary storage, cancel of confirm them first:', description);
            return { skipped: true }; // Indicate that the question was skipped
        }

          // Check if lessonId is provided
          const lessonIdString = lessonId || null;
          const quizTypeIdString = quizTypeId || null;
        if(meth==='typed'){ quizId= null}
          // Call the stored procedure to insert data into the temporary table
        await dbConn.raw(`
            EXEC dbo.IND_InsertTempQuestion @description = ?, @optionA = ?, @optionB = ?, @optionC = ?, @optionD = ?, @answer = ?, @marks = ?, @quizId = ?, @quizTypeId = ?,@lessonId = ?, @courseId = ?, @createdOn = ?, @createdBy = ?,@meth=?`,
            [descriptionString , optionAString, optionBString, optionCString, optionDString, answer, marks, quizId, quizTypeIdString, lessonIdString,courseId, createdOnString, createdBy,meth]
        );

        // Log the inserted quiz
        console.log('Question Uploaded Successfully:', description);
        return { skipped: false }; // Indicate that the question was inserted successfully
    } catch (error) {
        // Log or return the specific error received
        console.error('Error inserting data into temporary table:', error.message);
        throw new Error('Error inserting data into temporary table');
    }
}


function generateRandomId() {
    // Generate a random number between 1000000000 and 9999999999 (inclusive)
    return Math.floor(100000000000 + Math.random() * 900000000000);
}


// Display uploaded questions endpoint
router.get('/displayUploadedQuestions/:userId',  authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
        const userId = req.params.userId;

        // Fetch uploaded questions for the given user ID
        const uploadedQuestions = await dbConn('IND_tempQuestions').where('createdBy', userId);

        // Check if any questions were found
        if (!uploadedQuestions || uploadedQuestions.length === 0) {
            return res.status(404).json({ error: 'No uploaded questions found' });
        }

        // Return the uploaded questions
        res.status(200).json({ uploadedQuestions });
    } catch (error) {
        console.error('Error while fetching uploaded questions:', error);
        next(error);
    }
});

// Cancel uploaded questions endpoint
router.delete('/cancelUploadedQuestions/:userId',  authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
        const userId = req.params.userId;

        // Delete uploaded questions for the given user ID
        await dbConn('IND_tempQuestions').where('createdBy', userId).del();

        // Respond with success message
        res.status(200).json({ message: 'Uploaded questions canceled successfully' });
    } catch (error) {
        console.error('Error while canceling uploaded questions:', error);
        next(error);
    }
});

router.post('/confirmUploadQuizQuestions/:userId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const confirmingUserId = req.params.userId;

    try {
        // Check if the user attempting to confirm the upload is the same user who uploaded the questions
        const uploadedQuestionsByUser = await dbConn('IND_tempQuestions').where('createdBy', confirmingUserId);
        if (uploadedQuestionsByUser.length === 0) {
            return res.status(400).json({ error: 'No questions found uploaded by you, Please upload questions first !!!' });
        }

        // Call the stored procedure to confirm the upload
        await dbConn.raw('EXEC IND_ConfirmUploadQuestions ?', [confirmingUserId]);

        // Respond with success message
        res.status(200).json({ message: 'Questions confirmed and inserted into database successfully' });
    } catch (error) {
        // Handle errors
        console.error('Error confirming upload:', error);
        res.status(500).json({ error: 'An error occurred while confirming quiz questions upload' });
    }
});

router.post('/confirmInsertQuizQuestions/:userId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const confirmingUserId = req.params.userId;

    try {
        // Check if the user attempting to confirm the upload is the same user who uploaded the questions
        const uploadedQuestionsByUser = await dbConn('IND_tempQuestions').where('createdBy', confirmingUserId);
        if (uploadedQuestionsByUser.length === 0) {
            return res.status(400).json({ error: 'No questions found uploaded by you. Please upload questions first.' });
        }

        // Get the values for quizTypeId and lessonId from the request body
        const { quizTypeId, lessonId } = req.body;
        let finalLessonId;
        const quizId = generateQuizId();
        // Convert quizTypeId to a number
        const numericQuizTypeId = parseInt(quizTypeId, 10);

        // If lessonId is undefined or an empty string, set it to null
        if (typeof lessonId === 'undefined' || lessonId.trim() === '') {
            finalLessonId = null;
        } else {
            finalLessonId = lessonId;
        }

        // If quizTypeId is 2 and finalLessonId is null, set finalLessonId to null
        if (numericQuizTypeId === 2 && !finalLessonId) {
            finalLessonId = null;
        }

        // Check if numericQuizTypeId is 1 and finalLessonId is null
        if (numericQuizTypeId === 1 && !finalLessonId) {
            return res.status(400).json({ error: 'Sorry, Lesson is required for self-evaluation quizzes.' });
        }

     // If finalLessonId is not null, retrieve the courseId from IND_Lessons based on the finalLessonId
let lesson;
if (finalLessonId !== null) {
    lesson = await dbConn('IND_Lessons').select('courseId').where('id', finalLessonId).first();
    if (!lesson) {
        return res.status(400).json({ error: 'Invalid lessonId. Lesson not found.' });
    }
}

// Retrieve the questions from IND_tempQuestions for the specified confirmingUserId
const questions = await dbConn('IND_tempQuestions').where('createdBy', confirmingUserId);

// Iterate through the questions and update only the ones with matching courseId (if finalLessonId is not null)
for (const question of questions) {
    // If finalLessonId is not null and courseId exists, check if the courseId matches
    if (finalLessonId !== null && lesson && question.courseId !== lesson.courseId) {
        // Respond with error message indicating mismatch in courseId
        return res.status(400).json({ error: 'The provided lessonId does not match the courseId of the corresponding lesson.' });
    }

    // Update the quizTypeId, lessonId, and quizId for the question
    await dbConn('IND_tempQuestions')
    .where('questionId', question.questionId)
    .update({
        quizTypeId: numericQuizTypeId,
        lessonId: finalLessonId,
        quizId: quizId
    });

}

// Call the stored procedure to confirm the upload
await dbConn.raw('EXEC IND_ConfirmUploadQuestions ?', [confirmingUserId]);

// Respond with success message
res.status(200).json({ message: 'Questions confirmed and inserted into the database successfully.' });

} catch (error) {
    // Handle any errors
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
}
});

function generateQuizId() {
    // Generate a random number between 1000000000 and 9999999999 (inclusive)
    return Math.floor(100000000000 + Math.random() * 900000000000);
}

// Route to retrieve quizzes in a given course
router.get('/displayquizzes/:courseId', async (req, res) => {
    const courseId = req.params.courseId;

    try {
        // SQL query to fetch quiz details
        const quizzes = await dbConn.raw('SELECT * FROM IND_GetQuizzesByCourseId(?)', [courseId]);

        // Send quizzes data as JSON response
         res.status(200).json(quizzes);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to get questions and answers for a specific quiz
router.get('/displayquestions/:quizId',  authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']),async (req, res) => {
    const { quizId } = req.params;

    try {
        // Execute the function in the database
        const questionsAndAnswers = await dbConn.raw('SELECT * FROM IND_GetQuestionsAndAnswersByQuizId(?)', [quizId]);

        // Send the response
        res.json(questionsAndAnswers);
    } catch (error) {
        console.error('Error fetching questions and answers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
/////// ------ Deleting a Quiz by setting isDeleted to 1 , not completely deleteing it------
router.put('/deletequiz/:quizId',  authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']),async (req, res) => {
    const quizId = req.params.quizId;

    try {
        // SQL query to update the isDeleted column
        const result = await dbConn.raw(`
            UPDATE IND_Quizes
            SET isDeleted = 1
            WHERE Id = ?
        `, [quizId]);
  
        // Check if any rows were affected by the update
        if (!result) {
            return res.status(404).json({ error: 'Quiz not found or already deleted.' });
        }

        // Quiz successfully deleted
        res.status(200).json({ message: 'Quiz deleted successfully.' });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/////// ------ Updating a Quiz by either changing courseId, lessonId and quizTypeId------
router.put('/updateQuiz/:quizId',  authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']),async (req, res) => {
    try {
        const userId = req.user.userId; // Assuming the user object is available in the request and contains the user's ID
        const { courseName, quizTypeName, lessonName } = req.body;
        const quizId = req.params.quizId;

        // Execute the stored procedure using dbConn.raw with parameterized queries
        await dbConn.raw(`
            EXEC IND_UpdateQuiz @userId = ?, @quizId = ?, @courseName = ?, @quizTypeName = ?, @lessonName = ?
        `, [userId, quizId, courseName, quizTypeName, lessonName]);

        res.status(200).json({ message: 'Quiz updated successfully.' });
    } catch (error) {
        console.error('Error updating quiz:', error);
        res.status(500).json({ error: 'An error occurred while updating the quiz.' });
    }
});

router.delete('/deleteQuestion/:questionId', async (req, res) => {
    const questionId = req.params.questionId;

    try {
        // Call the stored procedure to delete the question
        const result = await dbConn.raw('EXEC IND_DeleteQuestion ?', [questionId]);

        // Check the result of the stored procedure execution
        if (result) {
            res.status(200).json({ message: 'Question deleted successfully.' });
        } else {
            res.status(404).json({ error: 'Question not found or already deleted.' });
        }
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'An error occurred while deleting the question.' });
    }
});


router.put('/updatequestion/:questionId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res) => {
    const questionId = req.params.questionId;
    const { description, options } = req.body;

    try {
        // Update question description if provided
        if (description) {
            await knex.raw('UPDATE IND_Questions SET Description = :description WHERE id = :questionId', { description, questionId });
        }

        // Update options
        await Promise.all(options.map(async (option) => {
            await knex.raw('UPDATE IND_QuestionAnswers SET optionDescription = :optionDescription, isCorrect = :isCorrect WHERE questionId = :questionId AND options = :optionChar', { 
                optionDescription: option.optionDescription, 
                isCorrect: option.isCorrect ? 1 : 0, 
                questionId, 
                optionChar: option.optionChar 
            });
        }));

        res.status(200).json({ message: 'Question updated successfully.' });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: 'Failed to update question. Please try again.' });
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

        // Send the courses as a response
        res.json(courses);
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

        // Send the courses as a response
        res.json(courses);
    } catch (error) {
        // Handle errors
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


export default router;
