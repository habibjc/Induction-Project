import { Router } from 'express';
import ExcelJS from 'exceljs';
import dbConn from '../dbConn.js';
import Course from '../models/Course.js';
import Quiz from '../models/Quiz.js';
import authenticateToken from '../middleware/authent.js';
import authorizeRoles from '../middleware/author.js';
import { isNull } from 'underscore';

const router = Router();

router.post('/addNewQuiz/:courseId', authenticateToken, authorizeRoles(['INDUCTION_OVERSIGHT','HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        //const {quizTypeId, lessonId } = req.body;
        // Validate courseId here

        console.log(req.body);
        console.log(req.files);

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
        const quizTypeId = 2;
        const meth = 'uploaded';
/*         const quizTypeId = req.body;
        const lessonId = req.body; */

        // Call function to upload quiz data
        const result =  await uploadQuizData(workbook, courseId, quizId, quizTypeId, createdOnString, createdBy,meth, res);
        // Check if any questions were skipped
        if (result && result.skipped) {
            return res.status(400).json({ error: 'Sorry, there are Similar questions, Upload Failed !!! Contact Support team' });
        } else {
            res.status(200).json({ message: 'Questions uploaded successfully !!!' }); 
        }
       
   
    } catch (error) {
        // Handle errors
        console.error('Error while adding quiz:', error);
        next(error);
    }
});
async function uploadQuizData(workbook, courseId, quizId, quizTypeId,createdOnString, createdBy,meth, res) {
    try {
        // Check if the user has existing questions in IND_tempQuestions
        const existingQuestions = await dbConn('IND_tempQuestions').where('createdBy', createdBy);
        if (existingQuestions.length > 0) {
            return res.status(400).json({ error: 'You have existing temporary questions. Please confirm or cancel those questions before uploading new ones.' });
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
            addTempInductionQuestion(question.description, question.optionA, question.optionB, question.optionC, question.optionD, question.marks,question.answer,  quizId, quizTypeId,courseId, createdOnString, createdBy,meth)
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

//////////////////////////////////////////////////////////////
/////////////////// ADDING EXAM /////////////////////////

router.post('/addNewExam', authenticateToken, authorizeRoles(['INDUCTION_OVERSIGHT','HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
      
        // Check if file is uploaded
        if (!req.files || !req.files.quizExcel) {
            return res.status(400).json({ error: 'No Excel file uploaded' });
        }

        // Read the file from the request stream
        const file = req.files.quizExcel;

        // Load the workbook from the uploaded Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.data);

        // Create a new quiz record in the database
        const courseId ='0000000000-000000000000000000-00-00000000000';
        const quizId1 = generateRandomId();
        const quizId = quizId1.toString();
        const createdOn = new Date();
        const createdOnString = createdOn.toISOString();
        const createdBy = req.user.userId;
        const quizTypeId = 1;
        
        const meth = 'uploaded';
/*         const quizTypeId = req.body;
        const lessonId = req.body; */

        // Call function to upload quiz data
        const result =  await uploadExerciseData(workbook, courseId, quizId, quizTypeId,createdOnString, createdBy,meth, res);
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
async function uploadExerciseData(workbook, courseId, quizId, quizTypeId,createdOnString, createdBy,meth, res) {
    try {
        // Check if the user has existing questions in IND_tempQuestions
        const existingQuestions = await dbConn('IND_tempQuestions').where('createdBy', createdBy);
        if (existingQuestions.length > 0) {
            return res.status(400).json({ error: 'You have existing temporery questions. Please confirm or cancel those questions before uploading new ones.' });
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
            addTempInductionQuestion(question.description, question.optionA, question.optionB, question.optionC, question.optionD, question.marks,question.answer,  quizId, quizTypeId,courseId, createdOnString, createdBy,meth)
        ));

        // Check if any questions were skipped
        const anySkipped = skippedQuestions.some(question => question.skipped);

        // Return a value indicating whether any questions were skipped
        return { skipped: anySkipped };
    } catch (error) {
        console.error('Error while uploading exam questions:', error.message);
        throw error; // Throw error to be caught by the calling function
    }
}


/////////////////// END EXERCISE ADDITION //////////////////
///////////////////////////////////////////////////////////



///// INSERTING DATA IN TEMP QUESTIONS FROM FORM ///////////

router.post('/addNewQuizFromForm/:courseId', authenticateToken, authorizeRoles(['INDUCTION_OVERSIGHT','HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        // Validate lessonId, quizTypeId, and question data
     
        if (!req.body.description || !req.body.optionA || !req.body.optionB || !req.body.optionC || !req.body.optionD || !req.body.marks || !req.body.answer) {
            return res.status(400).json({ error: 'Incomplete or invalid form data' });
        }

        // Create a new quiz record in the database
        const quizId = generateRandomId();
        const createdOnString = new Date().toISOString();
        const createdBy = req.user.userId;
        const quizTypeId = 2;
        const meth = 'typed';
        // Process the single question
        try {
            const { description, optionA, optionB, optionC, optionD, marks, answer } = req.body;

            // Insert question into the database using common quiz information
            const result = await addTempInductionQuestion(description, optionA, optionB, optionC, optionD, marks, answer, quizId, quizTypeId, courseId, createdOnString, createdBy,meth);

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

///////////////////////////////////////////////////////////////////////////////
//////////////////  ADDING EXAM THROUGH FORM /////////////////////////////

router.post('/addNewExamFromForm', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
        
  
        // Validate lessonId, quizTypeId, and question data
        if (!req.body.description || !req.body.optionA || !req.body.optionB || !req.body.optionC || !req.body.optionD || !req.body.marks || !req.body.answer) {
            return res.status(400).json({ error: 'Incomplete or invalid form data' });
        }

        // Create a new quiz record in the database
        const courseId = '0000000000-000000000000000000-00-00000000000';
        const quizId = generateRandomId();
        const createdOnString = new Date().toISOString();
        const createdBy = req.user.userId;
        const quizTypeId = 1;
        const meth = 'typed';
        // Process the single question
        try {
            const { description, optionA, optionB, optionC, optionD, marks, answer } = req.body;

            // Insert question into the database using common quiz information
            const result = await addTempInductionQuestion(description, optionA, optionB, optionC, optionD, marks, answer, quizId, quizTypeId, courseId, createdOnString, createdBy,meth);

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
        console.error('Error while adding new exam from form:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


//////////////////////// END OF EXERCISE ADDITION VIA FORM //////////////////
////////////////////////////////////////////////////////////////////////////


async function addTempInductionQuestion(description, optionA, optionB, optionC, optionD, marks, answer, quizId, quizTypeId, courseId, createdOnString, createdBy,meth, req) {
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

        
        
        if(meth==='typed'){ quizId= null}
          // Call the stored procedure to insert data into the temporary table
        await dbConn.raw(`
            EXEC dbo.IND_InsertTempQuestion @description = ?, @optionA = ?, @optionB = ?, @optionC = ?, @optionD = ?, @answer = ?, @marks = ?, @quizId = ?, @quizTypeId = ?, @courseId = ?, @createdOn = ?, @createdBy = ?,@meth=?`,
            [descriptionString , optionAString, optionBString, optionCString, optionDString, answer, marks, quizId, quizTypeId,courseId, createdOnString, createdBy,meth]
        );

        // Log the inserted quiz
        console.log('Question/s Uploaded Successfully:', description);
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
router.get('/displayUploadedQuestions/:userId',  authenticateToken, authorizeRoles(['INDUCTION_OVERSIGHT','HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
        const userId = req.params.userId;

        // Fetch uploaded questions for the given user ID
        const uploadedQuestions = await dbConn('IND_tempQuestions').where('createdBy', userId);

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

router.post('/confirmUploadQuizQuestions/:userId', authenticateToken, authorizeRoles(['INDUCTION_OVERSIGHT','HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
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
        // Check if the error is due to constraint violation
        if (error.number === 51000 && error.message.includes('Cannot insert another record with the same course')) {
            // If the error is due to the constraint violation, send custom error message to the user
            res.status(400).json({ error: 'Sorry, you cannot have 2 final quizzes on a single course OR 2 Exams. Please go to Quiz/Exam and add questions.' });
        } else {
            // For other types of errors, send the specific error message returned by the stored procedure
            console.error('An error occurred while confirming quiz questions upload:', error.message);
            res.status(500).json({ error: error.message });
        }
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

// Retrieve the questions from IND_tempQuestions for the specified confirmingUserId
const questions = await dbConn('IND_tempQuestions').where('createdBy', confirmingUserId);
const quizId = generateQuizId();
// Iterate through the questions and update only the ones with matching courseId (if finalLessonId is not null)
for (const question of questions) {
    
    // Update the quizTypeId, lessonId, and quizId for the question
    await dbConn('IND_tempQuestions')
    .where('questionId', question.questionId)
    .update({
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

/////// ------ Updating a Quiz by changing courseId, lessonId or quizTypeId------
router.put('/updateQuiz/:quizId',  authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']),async (req, res) => {
    try {
        const userId = req.user.userId; // Assuming the user object is available in the request and contains the user's ID
        const { courseName, quizTypeName, lessonName } = req.body;
        const quizId = req.params.quizId;

        // Execute the stored procedure using dbConn.raw with parameterized queries
        await dbConn.raw(`
            EXEC IND_UpdateQuiz @userId = ?, @quizId = ?, @courseName = ?
        `, [userId, quizId, courseName]);

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


// Route to handle updating a question
router.put('/updatequestion/:questionId',authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res) => {
    const { questionId } = req.params;
    const { NewDescription, OptionA, OptionADescription, OptionACorrect, OptionB, OptionBDescription, OptionBCorrect, OptionC, OptionCDescription, OptionCCorrect, OptionD, OptionDDescription, OptionDCorrect } = req.body;

    try {
        await dbConn.raw('EXEC IND_UpdateQuestion @QuestionID = ?, @NewDescription = ?, @OptionA = ?, @OptionADescription = ?, @OptionACorrect = ?, @OptionB = ?, @OptionBDescription = ?, @OptionBCorrect = ?, @OptionC = ?, @OptionCDescription = ?, @OptionCCorrect = ?, @OptionD = ?, @OptionDDescription = ?, @OptionDCorrect = ?', [questionId, NewDescription, OptionA, OptionADescription, OptionACorrect, OptionB, OptionBDescription, OptionBCorrect, OptionC, OptionCDescription, OptionCCorrect, OptionD, OptionDDescription, OptionDCorrect]);
        
        res.status(200).json({ message: 'Question updated successfully.' });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: 'Failed to update question. Please try again.' });
    }
});








/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// ROUTES ON ADDITION OF QUESTIONS ON EXISTING QUIZ OR EXAM /////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/addQuestionsToQuiz/:quizId', authenticateToken, authorizeRoles(['INDUCTION_OVERSIGHT','HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
        
        //const {quizTypeId, lessonId } = req.body;
        // Validate courseId here

        console.log(req.body);
        console.log(req.files);

        // Check if file is uploaded
        if (!req.files || !req.files.quizExcel) {
            return res.status(400).json({ error: 'No Excel file uploaded' });
        }
        const quizId = req.params.quizId;
        // Read the file from the request stream
        const file = req.files.quizExcel;

        // Load the workbook from the uploaded Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.data);

        // Validate courseId
        const quiz = await Quiz.query()
        .where('Id', quizId)
        .first(); // Use first() to retrieve only the first matching record

    if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
    }

        const courseId = quiz.courseId;
        const createdOn = new Date();
        const createdOnString = quiz.createdOn;
        const createdBy = req.user.userId;
        const quizTypeId =quiz.quizTypeId;
        const meth = 'uploaded';

        // Call function to upload quiz data
        const result =  await uploadQuizDataadded(workbook, courseId, quizId, quizTypeId, createdOnString, createdBy,meth, res);
        // Check if any questions were skipped
        if (result && result.skipped) {
            return res.status(400).json({ error: 'Sorry, there are Similar questions, Upload Failed !!! Contact Support team' });
        } else {
            res.status(200).json({ message: 'Questions uploaded successfully !!!' }); 
        }
       
   
    } catch (error) {
        // Handle errors
        console.error('Error while adding quiz:', error);
        next(error);
    }
});
async function uploadQuizDataadded(workbook, courseId, quizId, quizTypeId,createdOnString, createdBy,meth, res) {
    try {
        // Check if the user has existing questions in IND_tempQuestions
        const existingQuestions = await dbConn('IND_tempQuestions').where('createdBy', createdBy);
        if (existingQuestions.length > 0) {
            return res.status(400).json({ error: 'You have existing temporary questions. Please confirm or cancel those questions before uploading new ones.' });
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
            addTempInductionQuestionadded(question.description, question.optionA, question.optionB, question.optionC, question.optionD, question.marks,question.answer,  quizId, quizTypeId,courseId, createdOnString, createdBy,meth)
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

//////////////////////////////////////////////////////////////
/////////////////// ADDING QUESTIONS TO EXAM /////////////////////////

router.post('/addQuestionsToExam/:quizId', authenticateToken, authorizeRoles(['INDUCTION_OVERSIGHT','HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
        // Check if file is uploaded
        if (!req.files || !req.files.quizExcel) {
            return res.status(400).json({ error: 'No Excel file uploaded' });
        }
        const quizId = req.params.quizId;
        // Read the file from the request stream
        const file = req.files.quizExcel;

        // Load the workbook from the uploaded Excel file
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.data);

          // Validate courseId
         const quiz = await Quiz.query()
         .where('Id', quizId)
         .first(); // Use first() to retrieve only the first matching record
 
        if (!quiz) {
          return res.status(404).json({ error: 'Quiz not found' });
        }

        // Create a new quiz record in the database
        const courseId ='0000000000-000000000000000000-00-00000000000';
        const createdOn = new Date();
        const createdOnString = quiz.createdOn;
        const createdBy = req.user.userId;
        const quizTypeId = 1;
        
        const meth = 'uploaded';
/*         const quizTypeId = req.body;
        const lessonId = req.body; */

        // Call function to upload quiz data
        const result =  await uploadExerciseDataadded(workbook, courseId, quizId, quizTypeId,createdOnString, createdBy,meth, res);
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
async function uploadExerciseDataadded(workbook, courseId, quizId, quizTypeId,createdOnString, createdBy,meth, res) {
    try {
        // Check if the user has existing questions in IND_tempQuestions
        const existingQuestions = await dbConn('IND_tempQuestions').where('createdBy', createdBy);
        if (existingQuestions.length > 0) {
            return res.status(400).json({ error: 'You have existing temporery questions. Please confirm or cancel those questions before uploading new ones.' });
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
            addTempInductionQuestionadded(question.description, question.optionA, question.optionB, question.optionC, question.optionD, question.marks,question.answer,  quizId, quizTypeId,courseId, createdOnString, createdBy,meth)
        ));

        // Check if any questions were skipped
        const anySkipped = skippedQuestions.some(question => question.skipped);

        // Return a value indicating whether any questions were skipped
        return { skipped: anySkipped };
    } catch (error) {
        console.error('Error while uploading exam questions:', error.message);
        throw error; // Throw error to be caught by the calling function
    }
}


///// INSERTING DATA IN TEMP QUESTIONS FROM FORM ///////////

router.post('/addNewQuestionsToQuizFromForm/:quizId', authenticateToken, authorizeRoles(['INDUCTION_OVERSIGHT','HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
        
        // Validate lessonId, quizTypeId, and question data
     
        if (!req.body.description || !req.body.optionA || !req.body.optionB || !req.body.optionC || !req.body.optionD || !req.body.marks || !req.body.answer) {
            return res.status(400).json({ error: 'Incomplete or invalid form data' });
        }
        const quizId = req.params.quizId;
        // Validate courseId
        const quiz = await Quiz.query()
       .where('Id', quizId)
       .first(); // Use first() to retrieve only the first matching record
        
        if (!quiz) {
          return res.status(404).json({ error: 'Quiz not found' });
        }

        // Create a new quiz record in the database
        const courseId = quiz.courseId;
        const createdOnString = quiz.createdOn;
        const createdBy = req.user.userId;
        const quizTypeId = 2;
        const meth = 'typed';
        // Process the single question
        try {
            const { description, optionA, optionB, optionC, optionD, marks, answer } = req.body;

            // Insert question into the database using common quiz information
            const result = await addTempInductionQuestionadded(description, optionA, optionB, optionC, optionD, marks, answer, quizId, quizTypeId, courseId, createdOnString, createdBy,meth);

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

///////////////////////////////////////////////////////////////////////////////
//////////////////  ADDING EXAM THROUGH FORM /////////////////////////////

router.post('/addQuestionsToExamFromForm/:quizId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
                // Validate lessonId, quizTypeId, and question data
        if (!req.body.description || !req.body.optionA || !req.body.optionB || !req.body.optionC || !req.body.optionD || !req.body.marks || !req.body.answer) {
            return res.status(400).json({ error: 'Incomplete or invalid form data' });
        }
        const quizId = req.params.quizId;
          // Validate courseId
          const quiz = await Quiz.query()
          .where('Id', quizId)
          .first(); // Use first() to retrieve only the first matching record
         
        if (!quiz) {
          return res.status(404).json({ error: 'Quiz not found' });
        }
        // Create a new quiz record in the database
        const courseId = '0000000000-000000000000000000-00-00000000000';
        const createdOnString = quiz.createdOn;
        const createdBy = req.user.userId;
        const quizTypeId = 1;
        const meth = 'typed';
        // Process the single question
        try {
            const { description, optionA, optionB, optionC, optionD, marks, answer } = req.body;

            // Insert question into the database using common quiz information
            const result = await addTempInductionQuestionadded(description, optionA, optionB, optionC, optionD, marks, answer, quizId, quizTypeId, courseId, createdOnString, createdBy,meth);

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
        console.error('Error while adding new exam from form:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


async function addTempInductionQuestionadded(description, optionA, optionB, optionC, optionD, marks, answer, quizId, quizTypeId, courseId, createdOnString, createdBy,meth, req) {
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

       
          // Call the stored procedure to insert data into the temporary table
        await dbConn.raw(`
            EXEC dbo.IND_InsertTempQuestion @description = ?, @optionA = ?, @optionB = ?, @optionC = ?, @optionD = ?, @answer = ?, @marks = ?, @quizId = ?, @quizTypeId = ?, @courseId = ?, @createdOn = ?, @createdBy = ?,@meth=?`,
            [descriptionString , optionAString, optionBString, optionCString, optionDString, answer, marks, quizId, quizTypeId,courseId, createdOnString, createdBy,meth]
        );

        // Log the inserted quiz
        console.log('Question/s Uploaded Successfully:', description);
        return { skipped: false }; // Indicate that the question was inserted successfully
    } catch (error) {
        // Log or return the specific error received
        console.error('Error inserting data into temporary table:', error.message);
        throw new Error('Error inserting data into temporary table');
    }
}
router.post('/confirmQuizAddedQuestions/:userId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    const confirmingUserId = req.params.userId;

    try {
        // Check if the user attempting to confirm the upload is the same user who uploaded the questions
        const uploadedQuestionsByUser = await dbConn('IND_tempQuestions').where('createdBy', confirmingUserId);
        if (uploadedQuestionsByUser.length === 0) {
            return res.status(400).json({ error: 'No questions found uploaded by you. Please upload questions first.' });
        }

// Retrieve the questions from IND_tempQuestions for the specified confirmingUserId
const questions = await dbConn('IND_tempQuestions').where('createdBy', confirmingUserId);

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




export default router;
