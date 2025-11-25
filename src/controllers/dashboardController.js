const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Get dashboard overview
exports.getDashboard = async (req, res) => {
  try {
    // PostgreSQL returns { rows: [...] } instead of MySQL's [[...], metadata]
    const sitesCountResult = await db.query(
      'SELECT COUNT(*) as total FROM sites WHERE is_active = TRUE'
    );
    const sitesCount = sitesCountResult.rows;

    const staffCountResult = await db.query(
      'SELECT COUNT(*) as total FROM staff WHERE is_active = TRUE'
    );
    const staffCount = staffCountResult.rows;

    const inventoryCountResult = await db.query(
      "SELECT COUNT(*) as total FROM inventory WHERE date >= CURRENT_DATE - INTERVAL '30 days'"
    );
    const inventoryCount = inventoryCountResult.rows;

    const dprCountResult = await db.query(
      "SELECT COUNT(*) as total FROM dpr WHERE date >= CURRENT_DATE - INTERVAL '7 days'"
    );
    const dprCount = dprCountResult.rows;

    const todayAttendanceResult = await db.query(
      'SELECT COUNT(*) as total FROM attendance WHERE date = CURRENT_DATE'
    );
    const todayAttendance = todayAttendanceResult.rows;

    const recentDPRResult = await db.query(
      `SELECT d.*, s.site_name, w.work_name, w.unit 
       FROM dpr d 
       INNER JOIN sites s ON d.site_id = s.id 
       INNER JOIN work_types w ON d.work_type_id = w.id 
       ORDER BY d.created_at DESC 
       LIMIT 10`
    );
    const recentDPR = recentDPRResult.rows;

    const recentInventoryResult = await db.query(
      `SELECT i.*, s.site_name 
       FROM inventory i 
       INNER JOIN sites s ON i.site_id = s.id 
       ORDER BY i.created_at DESC 
       LIMIT 10`
    );
    const recentInventory = recentInventoryResult.rows;

    const activeSitesResult = await db.query(
      'SELECT id, site_name, site_address, start_date FROM sites WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    const activeSites = activeSitesResult.rows;

    const dashboardData = {
      stats: {
        total_sites: parseInt(sitesCount[0].total),
        total_staff: parseInt(staffCount[0].total),
        recent_inventory_entries: parseInt(inventoryCount[0].total),
        recent_dpr_entries: parseInt(dprCount[0].total),
        today_attendance: parseInt(todayAttendance[0].total)
      },
      recent_dpr: recentDPR,
      recent_inventory: recentInventory,
      active_sites: activeSites
    };

    successResponse(res, dashboardData, 'Dashboard data retrieved successfully');
  } catch (error) {
    console.error('Get dashboard error:', error);
    errorResponse(res, 'Failed to retrieve dashboard data', 500);
  }
};

// Get site-specific dashboard
exports.getSiteDashboard = async (req, res) => {
  try {
    const { site_id } = req.params;

    // Site details
    const siteResult = await db.query(
      'SELECT * FROM sites WHERE id = $1 AND is_active = TRUE',
      [site_id]
    );
    const site = siteResult.rows;

    if (site.length === 0) {
      return errorResponse(res, 'Site not found', 404);
    }

    // Total staff
    const staffCountResult = await db.query(
      'SELECT COUNT(*) as total FROM staff WHERE site_id = $1 AND is_active = TRUE',
      [site_id]
    );
    const staffCount = staffCountResult.rows;

    // Total inventory entries
    const inventoryCountResult = await db.query(
      'SELECT COUNT(*) as total FROM inventory WHERE site_id = $1',
      [site_id]
    );
    const inventoryCount = inventoryCountResult.rows;

    // Total DPR entries
    const dprCountResult = await db.query(
      'SELECT COUNT(*) as total FROM dpr WHERE site_id = $1',
      [site_id]
    );
    const dprCount = dprCountResult.rows;

    // Today's attendance
    const todayAttendanceResult = await db.query(
      `SELECT COUNT(*) as present 
       FROM attendance 
       WHERE site_id = $1 AND date = CURRENT_DATE AND status = 'Present'`,
      [site_id]
    );
    const todayAttendance = todayAttendanceResult.rows;

    // Recent DPR (last 5)
    const recentDPRResult = await db.query(
      `SELECT d.*, w.work_name, w.unit 
       FROM dpr d 
       INNER JOIN work_types w ON d.work_type_id = w.id 
       WHERE d.site_id = $1 
       ORDER BY d.date DESC, d.created_at DESC 
       LIMIT 5`,
      [site_id]
    );
    const recentDPR = recentDPRResult.rows;

    // Recent inventory (last 5)
    const recentInventoryResult = await db.query(
      `SELECT * FROM inventory 
       WHERE site_id = $1 
       ORDER BY date DESC, created_at DESC 
       LIMIT 5`,
      [site_id]
    );
    const recentInventory = recentInventoryResult.rows;

    // Staff list
    const staffListResult = await db.query(
      'SELECT id, staff_name, role, phone FROM staff WHERE site_id = $1 AND is_active = TRUE',
      [site_id]
    );
    const staffList = staffListResult.rows;

    const siteDashboard = {
      site: site[0],
      stats: {
        total_staff: staffCount[0].total,
        total_inventory_entries: inventoryCount[0].total,
        total_dpr_entries: dprCount[0].total,
        today_present: todayAttendance[0].present
      },
      recent_dpr: recentDPR,
      recent_inventory: recentInventory,
      staff: staffList
    };

    successResponse(res, siteDashboard, 'Site dashboard retrieved successfully');
  } catch (error) {
    console.error('Get site dashboard error:', error);
    errorResponse(res, 'Failed to retrieve site dashboard', 500);
  }
};