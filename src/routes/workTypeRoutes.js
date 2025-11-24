const express = require('express');
const router = express.Router();
const workTypeController = require('../controllers/workTypeController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/work-types
// @desc    Get all work types
// @access  Private
router.get('/', workTypeController.getAllWorkTypes);

// @route   GET /api/work-types/:id
// @desc    Get single work type
// @access  Private
router.get('/:id', workTypeController.getWorkTypeById);

// @route   POST /api/work-types
// @desc    Create new work type
// @access  Private
router.post('/', workTypeController.createWorkType);

// @route   PUT /api/work-types/:id
// @desc    Update work type
// @access  Private
router.put('/:id', workTypeController.updateWorkType);

// @route   DELETE /api/work-types/:id
// @desc    Delete work type
// @access  Private
router.delete('/:id', workTypeController.deleteWorkType);

module.exports = router;
