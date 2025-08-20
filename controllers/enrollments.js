const knex = require('../db/knex');

exports.getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await knex('enrollments')
      .join('users', 'enrollments.user_id', '=', 'users.id')
      .join('courses', 'enrollments.course_id', '=', 'courses.id')
      .select(
        'enrollments.id',
        'users.id as user_id',
        'users.name as student_name',
        'courses.id as course_id',
        'courses.title as course_title',
        'enrollments.enrolled_at'
      );

    res.status(200).json(enrollments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enrollments.' });
  }
};

exports.createEnrollment = async (req, res) => {
  const { user_id, course_id } = req.body;

  if (!user_id || !course_id) {
    return res.status(400).json({ error: 'user_id and course_id are required.' });
  }

  try {
    const [enrollment] = await knex('enrollments')
      .insert({ user_id, course_id })
      .returning('*');

    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ error: err.message }); // 👈 expose error directly in the response
  }
};
exports.deleteEnrollment = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await knex('enrollments').where({ id }).del();
    if (!deleted) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    res.status(200).json({ message: 'Enrollment deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete enrollment.' });
  }
};
