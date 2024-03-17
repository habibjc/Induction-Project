// index.js or app.js
import express from 'express';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import bodyParser from 'body-parser';
import coursesRoutes from './routes/coursesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import cors from "cors";   //Was missing

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
/* 
// Set EJS as the view engine
app.set('view engine', 'ejs');

// Get the directory name of the current module
const currentDir = path.dirname(new URL(import.meta.url).pathname);

// Set the path to the views directory
const viewsPath = path.join(currentDir, 'views');
 */

app.use(cors());   //Was missing
app.use(bodyParser.json());
app.use(errorHandler); // Using the imported errorHandler middleware
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/auth', authRoutes);
app.use(quizRoutes);
app.use(coursesRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
