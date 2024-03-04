// index.js or app.js
import express, { json } from 'express';
import dotenv from 'dotenv';
const envr = dotenv.config();
import fileUpload from 'express-fileupload';
import pkg from 'body-parser';
const { urlencoded } = pkg;
//import dbConn from './dbConn.js';
import coursesRoutes from './routes/coursesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import errorHandler from './middleware/errorHandler.js';
//import author from './middleware/author.js';
//import authenticateToken from './middleware/authent.js';

//const session = require('express-session');
//const KnexSessionStore = require('connect-session-knex')(session); // Import Knex session store

//import dbConn from './dbConn'; // Import dbConn

const app = express();
const port = process.env.PORT || 3000;
//const secret = process.env.SESSION_SECRET;

app.use(json());
app.use(errorHandler); // Using the imported errorHandler middleware
app.use(fileUpload());
app.use(urlencoded({ extended: true }));

// Configure session middleware
/* app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: new KnexSessionStore({
    knex: dbConn,
    tablename: 'sessions', // Name of the sessions table in your database
    createtable: true, // Create the sessions table if it doesn't exist
  }),
})); */

app.use('/auth', authRoutes);
app.use(quizRoutes);
app.use(coursesRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
