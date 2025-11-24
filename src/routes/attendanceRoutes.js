const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/auth');
const upload = require('../config/multer');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/attendance
// @desc    Get all attendance (with filters)
// @access  Private
router.get('/', attendanceController.getAllAttendance);

// @route   GET /api/attendance/:id
// @desc    Get single attendance
// @access  Private
router.get('/:id', attendanceController.getAttendanceById);

// @route   POST /api/attendance
// @desc    Create new attendance
// @access  Private
router.post('/', upload.single('photo'), attendanceController.createAttendance);

// @route   POST /api/attendance/bulk
// @desc    Create bulk attendance
// @access  Private
router.post('/bulk', attendanceController.bulkCreateAttendance);

// @route   PUT /api/attendance/:id
// @desc    Update attendance
// @access  Private
router.put('/:id', upload.single('photo'), attendanceController.updateAttendance);

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance
// @access  Private
router.delete('/:id', attendanceController.deleteAttendance);

// @route   GET /api/attendance/summary
// @desc    Get attendance summary
// @access  Private
router.get('/summary/report', attendanceController.getAttendanceSummary);

module.exports = router;
