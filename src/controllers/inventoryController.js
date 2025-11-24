const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Get all inventory
exports.getAllInventory = async (req, res) => {
  try {
    const { site_id, type, start_date, end_date } = req.query;
    
    let query = `
      SELECT i.*, s.site_name 
      FROM inventory i 
      INNER JOIN sites s ON i.site_id = s.id 
      WHERE 1=1
    `;
    const params = [];

    if (site_id) {
      query += ' AND i.site_id = ?';
      params.push(site_id);
    }

    if (type) {
      query += ' AND i.type = ?';
      params.push(type);
    }

    if (start_date) {
      query += ' AND i.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND i.date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY i.date DESC, i.created_at DESC';

    const [inventory] = await db.query(query, params);
    successResponse(res, inventory, 'Inventory retrieved successfully');
  } catch (error) {
    console.error('Get inventory error:', error);
    errorResponse(res, 'Failed to retrieve inventory', 500);
  }
};

// Get single inventory
exports.getInventoryById = async (req, res) => {
  try {
    const [inventory] = await db.query(
      `SELECT i.*, s.site_name 
       FROM inventory i 
       INNER JOIN sites s ON i.site_id = s.id 
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (inventory.length === 0) {
      return errorResponse(res, 'Inventory not found', 404);
    }

    successResponse(res, inventory[0], 'Inventory retrieved successfully');
  } catch (error) {
    console.error('Get inventory error:', error);
    errorResponse(res, 'Failed to retrieve inventory', 500);
  }
};

// Create inventory
exports.createInventory = async (req, res) => {
  try {
    const { site_id, material_name, quantity, type, date, description } = req.body;

    if (!site_id || !material_name || !quantity || !type || !date) {
      return errorResponse(res, 'Site, material name, quantity, type, and date are required', 400);
    }

    const receipt_image = req.file ? req.file.path : null;

    const [result] = await db.query(
      'INSERT INTO inventory (site_id, material_name, quantity, type, date, description, receipt_image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [site_id, material_name, quantity, type, date, description, receipt_image]
    );

    const [newInventory] = await db.query(
      `SELECT i.*, s.site_name 
       FROM inventory i 
       INNER JOIN sites s ON i.site_id = s.id 
       WHERE i.id = ?`,
      [result.insertId]
    );

    successResponse(res, newInventory[0], 'Inventory created successfully', 201);
  } catch (error) {
    console.error('Create inventory error:', error);
    errorResponse(res, 'Failed to create inventory', 500);
  }
};

// Update inventory
exports.updateInventory = async (req, res) => {
  try {
    const { site_id, material_name, quantity, type, date, description } = req.body;
    const { id } = req.params;

    let query = 'UPDATE inventory SET site_id = ?, material_name = ?, quantity = ?, type = ?, date = ?, description = ?';
    const params = [site_id, material_name, quantity, type, date, description];

    if (req.file) {
      query += ', receipt_image = ?';
      params.push(req.file.path);
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return errorResponse(res, 'Inventory not found', 404);
    }

    const [updatedInventory] = await db.query(
      `SELECT i.*, s.site_name 
       FROM inventory i 
       INNER JOIN sites s ON i.site_id = s.id 
       WHERE i.id = ?`,
      [id]
    );

    successResponse(res, updatedInventory[0], 'Inventory updated successfully');
  } catch (error) {
    console.error('Update inventory error:', error);
    errorResponse(res, 'Failed to update inventory', 500);
  }
};

// Delete inventory
exports.deleteInventory = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM inventory WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return errorResponse(res, 'Inventory not found', 404);
    }

    successResponse(res, null, 'Inventory deleted successfully');
  } catch (error) {
    console.error('Delete inventory error:', error);
    errorResponse(res, 'Failed to delete inventory', 500);
  }
};

// Get inventory summary by site
exports.getInventorySummary = async (req, res) => {
  try {
    const { site_id } = req.params;

    const [summary] = await db.query(
      `SELECT 
        material_name,
        SUM(CASE WHEN type = 'Incoming' THEN quantity ELSE 0 END) as total_incoming,
        SUM(CASE WHEN type = 'Outgoing' THEN quantity ELSE 0 END) as total_outgoing,
        (SUM(CASE WHEN type = 'Incoming' THEN quantity ELSE 0 END) - 
         SUM(CASE WHEN type = 'Outgoing' THEN quantity ELSE 0 END)) as current_stock
      FROM inventory 
      WHERE site_id = ?
      GROUP BY material_name
      ORDER BY material_name`,
      [site_id]
    );

    successResponse(res, summary, 'Inventory summary retrieved successfully');
  } catch (error) {
    console.error('Get inventory summary error:', error);
    errorResponse(res, 'Failed to retrieve inventory summary', 500);
  }
};
