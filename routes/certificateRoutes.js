// routes/certificateRoutes.js
const express = require('express');
const Certificate = require('../models/certificateModel');
const router = express.Router();

// GET all certificates
router.get('/', async (req, res) => {
  try {
    const all = await Certificate.getAll();
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch certificates', error: err.message });
  }
});

// GET one certificate by id
router.get('/:id', async (req, res) => {
  try {
    const cert = await Certificate.getById(req.params.id);
    if (cert) res.json(cert);
    else      res.status(404).json({ message: 'Certificate not found' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch certificate', error: err.message });
  }
});

// POST a new certificate
router.post('/', async (req, res) => {
  try {
    // expects { user_id, training_id, issued_at }
    const [newCert] = await Certificate.create(req.body);
    res.status(201).json(newCert);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create certificate', error: err.message });
  }
});

// PUT update a certificate
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await Certificate.update(req.params.id, req.body);
    if (updated) res.json(updated);
    else         res.status(404).json({ message: 'Certificate not found' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update certificate', error: err.message });
  }
});

// DELETE a certificate
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Certificate.remove(req.params.id);
    if (deleted) res.json({ message: 'Deleted successfully' });
    else         res.status(404).json({ message: 'Certificate not found' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete certificate', error: err.message });
  }
});

module.exports = router;
