const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/staff
// @desc    Get all staff (with optional site_id filter)
// @access  Private
router.get('/', staffController.getAllStaff);

// @route   GET /api/staff/:id
// @desc    Get single staff
// @access  Private
router.get('/:id', staffController.getStaffById);

// @route   POST /api/staff
// @desc    Create new staff
// @access  Private
router.post('/', staffController.createStaff);

// @route   PUT /api/staff/:id
// @desc    Update staff
// @access  Private
router.put('/:id', staffController.updateStaff);

// @route   DELETE /api/staff/:id
// @desc    Delete staff
// @access  Private
router.delete('/:id', staffController.deleteStaff);

module.exports = router;
