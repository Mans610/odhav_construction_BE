const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Get all DPR
exports.getAllDPR = async (req, res) => {
  try {
    const { site_id, work_type_id, date, start_date, end_date } = req.query;
    
    let query = `
      SELECT d.*, s.site_name, w.work_name, w.unit 
      FROM dpr d 
      INNER JOIN sites s ON d.site_id = s.id 
      INNER JOIN work_types w ON d.work_type_id = w.id 
      WHERE 1=1
    `;
    const params = [];

    if (site_id) {
      query += ' AND d.site_id = ?';
      params.push(site_id);
    }

    if (work_type_id) {
      query += ' AND d.work_type_id = ?';
      params.push(work_type_id);
    }

    if (date) {
      query += ' AND d.date = ?';
      params.push(date);
    }

    if (start_date) {
      query += ' AND d.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND d.date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY d.date DESC, d.created_at DESC';

    const [dpr] = await db.query(query, params);
    successResponse(res, dpr, 'DPR retrieved successfully');
  } catch (error) {
    console.error('Get DPR error:', error);
    errorResponse(res, 'Failed to retrieve DPR', 500);
  }
};

// Get single DPR
exports.getDPRById = async (req, res) => {
  try {
    const [dpr] = await db.query(
      `SELECT d.*, s.site_name, w.work_name, w.unit 
       FROM dpr d 
       INNER JOIN sites s ON d.site_id = s.id 
       INNER JOIN work_types w ON d.work_type_id = w.id 
       WHERE d.id = ?`,
      [req.params.id]
    );

    if (dpr.length === 0) {
      return errorResponse(res, 'DPR not found', 404);
    }

    successResponse(res, dpr[0], 'DPR retrieved successfully');
  } catch (error) {
    console.error('Get DPR error:', error);
    errorResponse(res, 'Failed to retrieve DPR', 500);
  }
};

// Create DPR
exports.createDPR = async (req, res) => {
  try {
    const { site_id, work_type_id, date, structure_name, quantity, remarks } = req.body;

    if (!site_id || !work_type_id || !date || !structure_name || !quantity) {
      return errorResponse(res, 'Site, work type, date, structure name, and quantity are required', 400);
    }

    const photo = req.file ? req.file.path : null;

    const [result] = await db.query(
      'INSERT INTO dpr (site_id, work_type_id, date, structure_name, quantity, remarks, photo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [site_id, work_type_id, date, structure_name, quantity, remarks, photo]
    );

    const [newDPR] = await db.query(
      `SELECT d.*, s.site_name, w.work_name, w.unit 
       FROM dpr d 
       INNER JOIN sites s ON d.site_id = s.id 
       INNER JOIN work_types w ON d.work_type_id = w.id 
       WHERE d.id = ?`,
      [result.insertId]
    );

    successResponse(res, newDPR[0], 'DPR created successfully', 201);
  } catch (error) {
    console.error('Create DPR error:', error);
    errorResponse(res, 'Failed to create DPR', 500);
  }
};

// Update DPR
exports.updateDPR = async (req, res) => {
  try {
    const { site_id, work_type_id, date, structure_name, quantity, remarks } = req.body;
    const { id } = req.params;

    let query = 'UPDATE dpr SET site_id = ?, work_type_id = ?, date = ?, structure_name = ?, quantity = ?, remarks = ?';
    const params = [site_id, work_type_id, date, structure_name, quantity, remarks];

    if (req.file) {
      query += ', photo = ?';
      params.push(req.file.path);
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return errorResponse(res, 'DPR not found', 404);
    }

    const [updatedDPR] = await db.query(
      `SELECT d.*, s.site_name, w.work_name, w.unit 
       FROM dpr d 
       INNER JOIN sites s ON d.site_id = s.id 
       INNER JOIN work_types w ON d.work_type_id = w.id 
       WHERE d.id = ?`,
      [id]
    );

    successResponse(res, updatedDPR[0], 'DPR updated successfully');
  } catch (error) {
    console.error('Update DPR error:', error);
    errorResponse(res, 'Failed to update DPR', 500);
  }
};

// Delete DPR
exports.deleteDPR = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM dpr WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return errorResponse(res, 'DPR not found', 404);
    }

    successResponse(res, null, 'DPR deleted successfully');
  } catch (error) {
    console.error('Delete DPR error:', error);
    errorResponse(res, 'Failed to delete DPR', 500);
  }
};

// Get DPR summary by site and work type
exports.getDPRSummary = async (req, res) => {
  try {
    const { site_id, start_date, end_date } = req.query;

    if (!site_id) {
      return errorResponse(res, 'Site ID is required', 400);
    }

    let query = `
      SELECT 
        w.work_name,
        w.unit,
        SUM(d.quantity) as total_quantity,
        COUNT(d.id) as entry_count
      FROM dpr d 
      INNER JOIN work_types w ON d.work_type_id = w.id 
      WHERE d.site_id = ?
    `;
    const params = [site_id];

    if (start_date) {
      query += ' AND d.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND d.date <= ?';
      params.push(end_date);
    }

    query += ' GROUP BY d.work_type_id, w.work_name, w.unit ORDER BY w.work_name';

    const [summary] = await db.query(query, params);

    successResponse(res, summary, 'DPR summary retrieved successfully');
  } catch (error) {
    console.error('Get DPR summary error:', error);
    errorResponse(res, 'Failed to retrieve DPR summary', 500);
  }
};

// Get cumulative progress by structure
exports.getCumulativeProgress = async (req, res) => {
  try {
    const { site_id, work_type_id } = req.query;

    if (!site_id || !work_type_id) {
      return errorResponse(res, 'Site ID and work type ID are required', 400);
    }

    const [progress] = await db.query(
      `SELECT 
        structure_name,
        SUM(quantity) as total_quantity
      FROM dpr 
      WHERE site_id = ? AND work_type_id = ?
      GROUP BY structure_name
      ORDER BY structure_name`,
      [site_id, work_type_id]
    );

    successResponse(res, progress, 'Cumulative progress retrieved successfully');
  } catch (error) {
    console.error('Get cumulative progress error:', error);
    errorResponse(res, 'Failed to retrieve cumulative progress', 500);
  }
};
