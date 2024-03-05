import { Router } from 'express';
import ExcelJS from 'exceljs';
import dbConn from '../dbConn.js';
import Course from '../models/Course.js';
import authenticateToken from '../middleware/authent.js';
import authorizeRoles from '../middleware/author.js';

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
/*         const quizTypeId = req.body;
        const lessonId = req.body; */

        // Call function to upload quiz data
        const result =  await uploadQuizData(workbook, courseId, quizId, quizTypeId,lessonId, createdOnString, createdBy, res);
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
async function uploadQuizData(workbook, courseId, quizId, quizTypeId,lessonId, createdOnString, createdBy, res) {
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
                    questions.push({ description, optionA, optionB, optionC, optionD, answer, marks: marksNumber });
                } else {
                    //  console.error('Invalid Value for Marks:', marks);
                    return;
                }
            }
        });

        // Insert questions into the database
        const skippedQuestions = await Promise.all(questions.map(question =>
            addTempInductionQuestion(question.description, question.optionA, question.optionB, question.optionC, question.optionD, question.answer, question.marks, quizId, quizTypeId,lessonId, courseId, createdOnString, createdBy)
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


async function addTempInductionQuestion(description, optionA, optionB, optionC, optionD, answer, marks, quizId, quizTypeId,lessonId, courseId, createdOnString, createdBy, req) {
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
            console.log('Similar question already exists:', description);
            return { skipped: true }; // Indicate that the question was skipped
        }

          // Check if lessonId is provided
          if (!lessonId) {
            lessonId = null; // Set lessonId to NULL if not provided
        }


        // Call the stored procedure to insert data into the temporary table
        await dbConn.raw(`
            EXEC dbo.IND_InsertTempQuestion @description = ?, @optionA = ?, @optionB = ?, @optionC = ?, @optionD = ?, @answer = ?, @marks = ?, @quizId = ?, @quizTypeId = ?,@lessonId = ?, @courseId = ?, @createdOn = ?, @createdBy = ?`,
            [descriptionString , optionAString, optionBString, optionCString, optionDString, answer, marks, quizId, quizTypeId, lessonId,courseId, createdOnString, createdBy]
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
router.get('/displayUploadedQuestions/:userId', authenticateToken, async (req, res, next) => {
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
router.delete('/cancelUploadedQuestions/:userId', authenticateToken, async (req, res, next) => {
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

router.post('/confirmUploadQuizQuestions/:userId', async (req, res, next) => {
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

export default router;
