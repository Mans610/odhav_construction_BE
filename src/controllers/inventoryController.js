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
    let paramIndex = 1;

    if (site_id) {
      query += ` AND i.site_id = $${paramIndex}`;
      params.push(site_id);
      paramIndex++;
    }

    if (type) {
      query += ` AND i.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND i.date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND i.date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ' ORDER BY i.date DESC, i.created_at DESC';

    const result = await db.query(query, params);
    const inventory = result.rows;
    successResponse(res, inventory, 'Inventory retrieved successfully');
  } catch (error) {
    console.error('Get inventory error:', error);
    errorResponse(res, 'Failed to retrieve inventory', 500);
  }
};

// Get single inventory
exports.getInventoryById = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT i.*, s.site_name 
       FROM inventory i 
       INNER JOIN sites s ON i.site_id = s.id 
       WHERE i.id = $1`,
      [req.params.id]
    );
    const inventory = result.rows;

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

    const result = await db.query(
      'INSERT INTO inventory (site_id, material_name, quantity, type, date, description, receipt_image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [site_id, material_name, quantity, type, date, description, receipt_image]
    );

    const newInventoryResult = await db.query(
      `SELECT i.*, s.site_name 
       FROM inventory i 
       INNER JOIN sites s ON i.site_id = s.id 
       WHERE i.id = $1`,
      [result.rows[0].id]
    );
    const newInventory = newInventoryResult.rows;

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

    let query = 'UPDATE inventory SET site_id = $1, material_name = $2, quantity = $3, type = $4, date = $5, description = $6';
    const params = [site_id, material_name, quantity, type, date, description];
    let paramIndex = 7;

    if (req.file) {
      query += `, receipt_image = $${paramIndex}`;
      params.push(req.file.path);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex}`;
    params.push(id);

    const result = await db.query(query, params);

    if (result.rowCount === 0) {
      return errorResponse(res, 'Inventory not found', 404);
    }

    const updatedInventoryResult = await db.query(
      `SELECT i.*, s.site_name 
       FROM inventory i 
       INNER JOIN sites s ON i.site_id = s.id 
       WHERE i.id = $1`,
      [id]
    );
    const updatedInventory = updatedInventoryResult.rows;

    successResponse(res, updatedInventory[0], 'Inventory updated successfully');
  } catch (error) {
    console.error('Update inventory error:', error);
    errorResponse(res, 'Failed to update inventory', 500);
  }
};

// Delete inventory
exports.deleteInventory = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM inventory WHERE id = $1', [req.params.id]);

    if (result.rowCount === 0) {
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

    const result = await db.query(
      `SELECT 
        material_name,
        SUM(CASE WHEN type = 'Incoming' THEN quantity ELSE 0 END) as total_incoming,
        SUM(CASE WHEN type = 'Outgoing' THEN quantity ELSE 0 END) as total_outgoing,
        (SUM(CASE WHEN type = 'Incoming' THEN quantity ELSE 0 END) - 
         SUM(CASE WHEN type = 'Outgoing' THEN quantity ELSE 0 END)) as current_stock
      FROM inventory 
      WHERE site_id = $1
      GROUP BY material_name
      ORDER BY material_name`,
      [site_id]
    );
    const summary = result.rows;

    successResponse(res, summary, 'Inventory summary retrieved successfully');
  } catch (error) {
    console.error('Get inventory summary error:', error);
    errorResponse(res, 'Failed to retrieve inventory summary', 500);
  }
};