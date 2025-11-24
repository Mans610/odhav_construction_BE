const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/auth');
const upload = require('../config/multer');

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/inventory
// @desc    Get all inventory (with filters)
// @access  Private
router.get('/', inventoryController.getAllInventory);

// @route   GET /api/inventory/:id
// @desc    Get single inventory
// @access  Private
router.get('/:id', inventoryController.getInventoryById);

// @route   POST /api/inventory
// @desc    Create new inventory
// @access  Private
router.post('/', upload.single('receipt_image'), inventoryController.createInventory);

// @route   PUT /api/inventory/:id
// @desc    Update inventory
// @access  Private
router.put('/:id', upload.single('receipt_image'), inventoryController.updateInventory);

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory
// @access  Private
router.delete('/:id', inventoryController.deleteInventory);

// @route   GET /api/inventory/summary/:site_id
// @desc    Get inventory summary by site
// @access  Private
router.get('/summary/:site_id', inventoryController.getInventorySummary);

module.exports = router;
