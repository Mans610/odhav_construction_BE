const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Get all sites
exports.getAllSites = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM sites WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    const sites = result.rows;
    successResponse(res, sites, 'Sites retrieved successfully');
  } catch (error) {
    console.error('Get sites error:', error);
    errorResponse(res, 'Failed to retrieve sites', 500);
  }
};

// Get single site
exports.getSiteById = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM sites WHERE id = $1 AND is_active = TRUE',
      [req.params.id]
    );
    const sites = result.rows;

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

    const result = await db.query(
      'INSERT INTO sites (site_name, site_address, start_date, notes) VALUES ($1, $2, $3, $4) RETURNING id',
      [site_name, site_address, start_date, notes]
    );

    const newSiteResult = await db.query('SELECT * FROM sites WHERE id = $1', [result.rows[0].id]);
    const newSite = newSiteResult.rows;

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

    const result = await db.query(
      'UPDATE sites SET site_name = $1, site_address = $2, start_date = $3, notes = $4 WHERE id = $5',
      [site_name, site_address, start_date, notes, id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Site not found', 404);
    }

    const updatedSiteResult = await db.query('SELECT * FROM sites WHERE id = $1', [id]);
    const updatedSite = updatedSiteResult.rows;

    successResponse(res, updatedSite[0], 'Site updated successfully');
  } catch (error) {
    console.error('Update site error:', error);
    errorResponse(res, 'Failed to update site', 500);
  }
};

// Delete site (soft delete)
exports.deleteSite = async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE sites SET is_active = FALSE WHERE id = $1',
      [req.params.id]
    );

    if (result.rowCount === 0) {
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
    const staffCountResult = await db.query(
      'SELECT COUNT(*) as total FROM staff WHERE site_id = $1 AND is_active = TRUE',
      [id]
    );
    const staffCount = staffCountResult.rows;

    // Get total inventory items
    const inventoryCountResult = await db.query(
      'SELECT COUNT(*) as total FROM inventory WHERE site_id = $1',
      [id]
    );
    const inventoryCount = inventoryCountResult.rows;

    // Get recent DPR entries
    const recentDPRResult = await db.query(
      "SELECT COUNT(*) as total FROM dpr WHERE site_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'",
      [id]
    );
    const recentDPR = recentDPRResult.rows;

    // Get today's attendance
    const todayAttendanceResult = await db.query(
      'SELECT COUNT(*) as total FROM attendance WHERE site_id = $1 AND date = CURRENT_DATE',
      [id]
    );
    const todayAttendance = todayAttendanceResult.rows;

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