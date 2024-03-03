/* // controllers/coursesController.js
const Course = require('../models/Course');
const Joi = require('joi');
const errorHandler = require('../middleware/errorHandler');

const validateCourseData = (data) => {
  const schema = Joi.object({
    courseId: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    positionId: Joi.string().required(),
    entitySectorId: Joi.string().required(),
    uploadedDate: Joi.date().required(),
    contentLink: Joi.string().required(),
    contentFile: Joi.string(),//.required(),
    courseImage: Joi.string(),//.required(),
    isDeleted: Joi.string().required(),
    createdBy: Joi.string().required(),
  });

  const { error } = schema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
};

const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.query();
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

const getCourseById = async (req, res, next) => {
  const courseId = req.params.id;

  try {
    const course = await Course.query().findById(courseId);
    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ error: 'Course not found' });
    }
  } catch (error) {
    next(error);
  }
};

const addCourse = async (req, res, next) => {
  const courseData = req.body;

  try {
    validateCourseData(courseData);

    const { files } = req;

    if (files && files.image) {
      const imageName = 'course_image_' + Date.now() + '_' + files.image.name;
      files.image.mv('uploadedCourses/' + imageName); // Move the image file to the 'uploadedCourses' folder
      courseData.image = '/uploadedCourses/' + imageName;
    }

    if (files && files.contentFile) {
      const contentFileName = 'course_content_' + Date.now() + '_' + files.contentFile.name;
      files.contentFile.mv('uploadedCourses/' + contentFileName); // Move the content file to the 'uploadedCourses' folder
      courseData.contentFile = '/uploadedCourses/' + contentFileName;
    }

    if (files && files.courseImage) {
      const courseImageName = 'course_image_' + Date.now() + '_' + files.courseImage.name;
      files.courseImage.mv('uploadedCourses/' + courseImageName); // Move the course image file to the 'uploadedCourses' folder
      courseData.courseImage = courseImageName;
    }

    const newCourse = await Course.query().insert(courseData);

    res.status(201).json(newCourse);
  } catch (error) {
    next(error);
  }
};

   
const updateCourse = async (req, res, next) => {
  const courseId = req.params.id;
  const updatedCourseData = req.body;

  try {
    validateCourseData(updatedCourseData);

    const updatedCourse = await Course.query().patchAndFetchById(courseId, updatedCourseData);

    if (updatedCourse) {
      res.json(updatedCourse);
    } else {
      res.status(404).json({ error: 'Course not found' });
    }
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  const courseId = req.params.id;

  try {
    const deletedCourse = await Course.query().deleteById(courseId);

    if (deletedCourse) {
      res.json({ message: 'Course deleted successfully' });
    } else {
      res.status(404).json({ error: 'Course not found' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  addCourse,
  updateCourse,
  deleteCourse,
};
 */