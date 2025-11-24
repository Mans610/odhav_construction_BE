const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/dashboard
// @desc    Get dashboard overview
// @access  Private
router.get('/', dashboardController.getDashboard);

// @route   GET /api/dashboard/site/:site_id
// @desc    Get site-specific dashboard
// @access  Private
router.get('/site/:site_id', dashboardController.getSiteDashboard);

module.exports = router;
