const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Get all sites
exports.getAllSites = async (req, res) => {
  try {
    const [sites] = await db.query(
      'SELECT * FROM sites WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    successResponse(res, sites, 'Sites retrieved successfully');
  } catch (error) {
    console.error('Get sites error:', error);
    errorResponse(res, 'Failed to retrieve sites', 500);
  }
};

// Get single site
exports.getSiteById = async (req, res) => {
  try {
    const [sites] = await db.query(
      'SELECT * FROM sites WHERE id = ? AND is_active = TRUE',
      [req.params.id]
    );

    if (sites.length === 0) {
      return errorResponse(res, 'Site not found', 404);
    }

    successResponse(res, sites[0], 'Site retrieved successfully');
  } catch (error) {
    console.error('Get site error:', error);
    errorResponse(res, 'Failed to retrieve site', 500);
  }
};

// Create site
exports.createSite = async (req, res) => {
  try {
    const { site_name, site_address, start_date, notes } = req.body;

    if (!site_name) {
      return errorResponse(res, 'Site name is required', 400);
    }

    const [result] = await db.query(
      'INSERT INTO sites (site_name, site_address, start_date, notes) VALUES (?, ?, ?, ?)',
      [site_name, site_address, start_date, notes]
    );

    const [newSite] = await db.query('SELECT * FROM sites WHERE id = ?', [result.insertId]);

    successResponse(res, newSite[0], 'Site created successfully', 201);
  } catch (error) {
    console.error('Create site error:', error);
    errorResponse(res, 'Failed to create site', 500);
  }
};

// Update site
exports.updateSite = async (req, res) => {
  try {
    const { site_name, site_address, start_date, notes } = req.body;
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE sites SET site_name = ?, site_address = ?, start_date = ?, notes = ? WHERE id = ?',
      [site_name, site_address, start_date, notes, id]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, 'Site not found', 404);
    }

    const [updatedSite] = await db.query('SELECT * FROM sites WHERE id = ?', [id]);

    successResponse(res, updatedSite[0], 'Site updated successfully');
  } catch (error) {
    console.error('Update site error:', error);
    errorResponse(res, 'Failed to update site', 500);
  }
};

// Delete site (soft delete)
exports.deleteSite = async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE sites SET is_active = FALSE WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, 'Site not found', 404);
    }

    successResponse(res, null, 'Site deleted successfully');
  } catch (error) {
    console.error('Delete site error:', error);
    errorResponse(res, 'Failed to delete site', 500);
  }
};

// Get site dashboard stats
exports.getSiteStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Get total staff
    const [staffCount] = await db.query(
      'SELECT COUNT(*) as total FROM staff WHERE site_id = ? AND is_active = TRUE',
      [id]
    );

    // Get total inventory items
    const [inventoryCount] = await db.query(
      'SELECT COUNT(*) as total FROM inventory WHERE site_id = ?',
      [id]
    );

    // Get recent DPR entries
    const [recentDPR] = await db.query(
      'SELECT COUNT(*) as total FROM dpr WHERE site_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)',
      [id]
    );

    // Get today's attendance
    const [todayAttendance] = await db.query(
      'SELECT COUNT(*) as total FROM attendance WHERE site_id = ? AND date = CURDATE()',
      [id]
    );

    successResponse(res, {
      total_staff: staffCount[0].total,
      total_inventory_entries: inventoryCount[0].total,
      recent_dpr_entries: recentDPR[0].total,
      today_attendance: todayAttendance[0].total
    }, 'Site stats retrieved successfully');
  } catch (error) {
    console.error('Get site stats error:', error);
    errorResponse(res, 'Failed to retrieve site stats', 500);
  }
};
