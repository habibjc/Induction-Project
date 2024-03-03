import { Router } from 'express';
const router = Router();
import { v4 as uuidv4 } from 'uuid';
import dbConn from '../dbConn';
import Quiz from '../models/Quiz';
import Question from '../models/Question';
import QuestionAnswer from '../models/QuestionAnswer';
import QuizQuestion from '../models/quizQuestion';
import errorHandler from '../middleware/errorHandler';
import authenticateToken from '../middleware/authent';
import authorizeRoles from '../middleware/author';
import { Workbook } from 'exceljs';
import fs from 'fs';

router.post('/addQuiz/:courseId', authenticateToken, authorizeRoles(['HR', 'DEVELOPER', 'ADMIN']), async (req, res, next) => {
    try {
        const courseId = req.params.courseId;
        // Validate courseId here

        // Check if file is uploaded
        if (!req.files || !req.files.quizExcel) {
            return res.status(400).json({ error: 'No Excel file uploaded' });
        }

        // Read the file from the request stream
        const file = req.files.quizExcel;

        // Load the workbook from the uploaded Excel file
        const workbook = new Workbook();
        await workbook.xlsx.load(file.data);

        // Assuming the questions are in the first worksheet (index 0)
        const worksheet = workbook.worksheets[0];

       // Iterate over each row in the worksheet to extract question data
       const quizData = [];
           worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 1) { // Skip the header row
                console.log(row.values); // Print row values for debugging
        
                // Extract values from row (skip the first empty item)
                const [, description, options, optionDescription, isCorrect, marks] = row.values;
        
                // Push the extracted data into the quizData array
                quizData.push({
                    courseId,
                    description,
                    options,
                    optionDescription,
                    isCorrect,
                    marks
                });
            }
        });
        
        // Log the extracted quiz data
        console.log(quizData);

        // Insert the quiz data into the database
        // Implement database interaction here

        // Respond with success message
        res.status(200).json({ message: 'Quiz data uploaded successfully' });
    } catch (error) {
        // Handle errors
        console.error('Error while adding quiz:', error);
        next(error);
    }
});

// Export the router
export default router;
