const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/sites
// @desc    Get all sites
// @access  Private
router.get('/', siteController.getAllSites);

// @route   GET /api/sites/:id
// @desc    Get single site
// @access  Private
router.get('/:id', siteController.getSiteById);

// @route   POST /api/sites
// @desc    Create new site
// @access  Private
router.post('/', siteController.createSite);

// @route   PUT /api/sites/:id
// @desc    Update site
// @access  Private
router.put('/:id', siteController.updateSite);

// @route   DELETE /api/sites/:id
// @desc    Delete site
// @access  Private
router.delete('/:id', siteController.deleteSite);

// @route   GET /api/sites/:id/stats
// @desc    Get site statistics
// @access  Private
router.get('/:id/stats', siteController.getSiteStats);

module.exports = router;
