const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance');

// GET all attendance records
router.get('/', attendanceController.getAllAttendance);

// POST create new attendance + auto certificate
router.post('/', attendanceController.createAttendance);

// DELETE attendance by ID
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;
