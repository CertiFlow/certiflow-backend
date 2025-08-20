const knex = require('../db/knex');

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await knex('courses').select('*');
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
};

exports.createCourse = async (req, res) => {
  const { title, description, level, start_date, end_date } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  try {
    const [newCourse] = await knex('courses')
      .insert({ title, description, level, start_date, end_date })
      .returning('*');
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create course.' });
  }
};

exports.deleteCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await knex('courses').where({ id }).del();
    if (!deleted) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    res.status(200).json({ message: 'Course deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete course.' });
  }
};
