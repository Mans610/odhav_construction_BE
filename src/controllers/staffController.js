const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Get all staff
exports.getAllStaff = async (req, res) => {
  try {
    const { site_id } = req.query;
    
    let query = `
      SELECT s.*, st.site_name 
      FROM staff s 
      LEFT JOIN sites st ON s.site_id = st.id 
      WHERE s.is_active = TRUE
    `;
    const params = [];

    if (site_id) {
      query += ' AND s.site_id = $1';
      params.push(site_id);
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await db.query(query, params);
    const staff = result.rows;
    successResponse(res, staff, 'Staff retrieved successfully');
  } catch (error) {
    console.error('Get staff error:', error);
    errorResponse(res, 'Failed to retrieve staff', 500);
  }
};

// Get single staff
exports.getStaffById = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, st.site_name 
       FROM staff s 
       LEFT JOIN sites st ON s.site_id = st.id 
       WHERE s.id = $1 AND s.is_active = TRUE`,
      [req.params.id]
    );
    const staff = result.rows;

    if (staff.length === 0) {
      return errorResponse(res, 'Staff not found', 404);
    }

    successResponse(res, staff[0], 'Staff retrieved successfully');
  } catch (error) {
    console.error('Get staff error:', error);
    errorResponse(res, 'Failed to retrieve staff', 500);
  }
};

// Create staff
exports.createStaff = async (req, res) => {
  try {
    const { staff_name, role, phone, site_id } = req.body;

    if (!staff_name || !role) {
      return errorResponse(res, 'Staff name and role are required', 400);
    }

    const result = await db.query(
      'INSERT INTO staff (staff_name, role, phone, site_id) VALUES ($1, $2, $3, $4) RETURNING id',
      [staff_name, role, phone, site_id]
    );

    const newStaffResult = await db.query(
      `SELECT s.*, st.site_name 
       FROM staff s 
       LEFT JOIN sites st ON s.site_id = st.id 
       WHERE s.id = $1`,
      [result.rows[0].id]
    );
    const newStaff = newStaffResult.rows;

    successResponse(res, newStaff[0], 'Staff created successfully', 201);
  } catch (error) {
    console.error('Create staff error:', error);
    errorResponse(res, 'Failed to create staff', 500);
  }
};

// Update staff
exports.updateStaff = async (req, res) => {
  try {
    const { staff_name, role, phone, site_id } = req.body;
    const { id } = req.params;

    const result = await db.query(
      'UPDATE staff SET staff_name = $1, role = $2, phone = $3, site_id = $4 WHERE id = $5',
      [staff_name, role, phone, site_id, id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Staff not found', 404);
    }

    const updatedStaffResult = await db.query(
      `SELECT s.*, st.site_name 
       FROM staff s 
       LEFT JOIN sites st ON s.site_id = st.id 
       WHERE s.id = $1`,
      [id]
    );
    const updatedStaff = updatedStaffResult.rows;

    successResponse(res, updatedStaff[0], 'Staff updated successfully');
  } catch (error) {
    console.error('Update staff error:', error);
    errorResponse(res, 'Failed to update staff', 500);
  }
};

// Delete staff (soft delete)
exports.deleteStaff = async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE staff SET is_active = FALSE WHERE id = $1',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Staff not found', 404);
    }

    successResponse(res, null, 'Staff deleted successfully');
  } catch (error) {
    console.error('Delete staff error:', error);
    errorResponse(res, 'Failed to delete staff', 500);
  }
};