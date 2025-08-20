// certiflow-backend/routes/trainingRoutes.js
const express = require('express');
const Training = require('../models/trainingModel');
const authenticate = require('../middleware/authenticate');
const router = express.Router();

// all routes require a valid JWT
router.use(authenticate);

// GET /api/trainings
router.get('/', async (req, res) => {
  try {
    const all = await Training.getAll();
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching trainings' });
  }
});

// POST /api/trainings
router.post('/', async (req, res) => {
  try {
    const [newTraining] = await Training.create(req.body);
    res.status(201).json(newTraining);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating training' });
  }
});

// DELETE /api/trainings/:id
// Only allow deletion if the training date is still in the future
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const t = await Training.getById(id);
    if (!t) return res.status(404).json({ message: 'Training not found' });

    if (new Date(t.scheduled_at) <= new Date()) {
      return res
        .status(400)
        .json({ message: 'Cannot delete trainings that have already occurred' });
    }

    await Training.delete(id);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting training' });
  }
});

module.exports = router;
