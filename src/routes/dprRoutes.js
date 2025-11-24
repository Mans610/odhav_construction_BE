const express = require('express');
const router = express.Router();
const dprController = require('../controllers/dprController');
const authMiddleware = require('../middleware/auth');
const upload = require('../config/multer');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/dpr
// @desc    Get all DPR (with filters)
// @access  Private
router.get('/', dprController.getAllDPR);

// @route   GET /api/dpr/:id
// @desc    Get single DPR
// @access  Private
router.get('/:id', dprController.getDPRById);

// @route   POST /api/dpr
// @desc    Create new DPR
// @access  Private
router.post('/', upload.single('photo'), dprController.createDPR);

// @route   PUT /api/dpr/:id
// @desc    Update DPR
// @access  Private
router.put('/:id', upload.single('photo'), dprController.updateDPR);

// @route   DELETE /api/dpr/:id
// @desc    Delete DPR
// @access  Private
router.delete('/:id', dprController.deleteDPR);

// @route   GET /api/dpr/summary/report
// @desc    Get DPR summary
// @access  Private
router.get('/summary/report', dprController.getDPRSummary);

// @route   GET /api/dpr/cumulative/progress
// @desc    Get cumulative progress
// @access  Private
router.get('/cumulative/progress', dprController.getCumulativeProgress);

module.exports = router;
