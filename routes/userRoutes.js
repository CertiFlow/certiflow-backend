const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

// GET user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.getById(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
});

// POST create new user
router.post('/', async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await User.update(req.params.id, req.body);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await User.delete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
});

module.exports = router;
