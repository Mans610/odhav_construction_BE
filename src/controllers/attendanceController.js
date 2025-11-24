const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Get all attendance
exports.getAllAttendance = async (req, res) => {
  try {
    const { site_id, staff_id, date, start_date, end_date } = req.query;
    
    let query = `
      SELECT a.*, s.staff_name, s.role, st.site_name 
      FROM attendance a 
      INNER JOIN staff s ON a.staff_id = s.id 
      INNER JOIN sites st ON a.site_id = st.id 
      WHERE 1=1
    `;
    const params = [];

    if (site_id) {
      query += ' AND a.site_id = ?';
      params.push(site_id);
    }

    if (staff_id) {
      query += ' AND a.staff_id = ?';
      params.push(staff_id);
    }

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }

    if (start_date) {
      query += ' AND a.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND a.date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY a.date DESC, a.created_at DESC';

    const [attendance] = await db.query(query, params);
    successResponse(res, attendance, 'Attendance retrieved successfully');
  } catch (error) {
    console.error('Get attendance error:', error);
    errorResponse(res, 'Failed to retrieve attendance', 500);
  }
};

// Get single attendance
exports.getAttendanceById = async (req, res) => {
  try {
    const [attendance] = await db.query(
      `SELECT a.*, s.staff_name, s.role, st.site_name 
       FROM attendance a 
       INNER JOIN staff s ON a.staff_id = s.id 
       INNER JOIN sites st ON a.site_id = st.id 
       WHERE a.id = ?`,
      [req.params.id]
    );

    if (attendance.length === 0) {
      return errorResponse(res, 'Attendance not found', 404);
    }

    successResponse(res, attendance[0], 'Attendance retrieved successfully');
  } catch (error) {
    console.error('Get attendance error:', error);
    errorResponse(res, 'Failed to retrieve attendance', 500);
  }
};

// Create attendance
exports.createAttendance = async (req, res) => {
  try {
    const { staff_id, site_id, date, status, notes } = req.body;

    if (!staff_id || !site_id || !date || !status) {
      return errorResponse(res, 'Staff, site, date, and status are required', 400);
    }

    const photo = req.file ? req.file.path : null;

    const [result] = await db.query(
      'INSERT INTO attendance (staff_id, site_id, date, status, notes, photo) VALUES (?, ?, ?, ?, ?, ?)',
      [staff_id, site_id, date, status, notes, photo]
    );

    const [newAttendance] = await db.query(
      `SELECT a.*, s.staff_name, s.role, st.site_name 
       FROM attendance a 
       INNER JOIN staff s ON a.staff_id = s.id 
       INNER JOIN sites st ON a.site_id = st.id 
       WHERE a.id = ?`,
      [result.insertId]
    );

    successResponse(res, newAttendance[0], 'Attendance created successfully', 201);
  } catch (error) {
    console.error('Create attendance error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return errorResponse(res, 'Attendance already marked for this staff on this date', 400);
    }
    errorResponse(res, 'Failed to create attendance', 500);
  }
};

// Update attendance
exports.updateAttendance = async (req, res) => {
  try {
    const { staff_id, site_id, date, status, notes } = req.body;
    const { id } = req.params;

    let query = 'UPDATE attendance SET staff_id = ?, site_id = ?, date = ?, status = ?, notes = ?';
    const params = [staff_id, site_id, date, status, notes];

    if (req.file) {
      query += ', photo = ?';
      params.push(req.file.path);
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return errorResponse(res, 'Attendance not found', 404);
    }

    const [updatedAttendance] = await db.query(
      `SELECT a.*, s.staff_name, s.role, st.site_name 
       FROM attendance a 
       INNER JOIN staff s ON a.staff_id = s.id 
       INNER JOIN sites st ON a.site_id = st.id 
       WHERE a.id = ?`,
      [id]
    );

    successResponse(res, updatedAttendance[0], 'Attendance updated successfully');
  } catch (error) {
    console.error('Update attendance error:', error);
    errorResponse(res, 'Failed to update attendance', 500);
  }
};

// Delete attendance
exports.deleteAttendance = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM attendance WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return errorResponse(res, 'Attendance not found', 404);
    }

    successResponse(res, null, 'Attendance deleted successfully');
  } catch (error) {
    console.error('Delete attendance error:', error);
    errorResponse(res, 'Failed to delete attendance', 500);
  }
};

// Get attendance summary by site and date range
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { site_id, start_date, end_date } = req.query;

    if (!site_id || !start_date || !end_date) {
      return errorResponse(res, 'Site ID, start date, and end date are required', 400);
    }

    const [summary] = await db.query(
      `SELECT 
        status,
        COUNT(*) as count
      FROM attendance 
      WHERE site_id = ? AND date BETWEEN ? AND ?
      GROUP BY status`,
      [site_id, start_date, end_date]
    );

    successResponse(res, summary, 'Attendance summary retrieved successfully');
  } catch (error) {
    console.error('Get attendance summary error:', error);
    errorResponse(res, 'Failed to retrieve attendance summary', 500);
  }
};

// Mark bulk attendance for multiple staff
exports.bulkCreateAttendance = async (req, res) => {
  try {
    const { site_id, date, attendances } = req.body;

    if (!site_id || !date || !Array.isArray(attendances) || attendances.length === 0) {
      return errorResponse(res, 'Site ID, date, and attendances array are required', 400);
    }

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const insertedIds = [];

      for (const attendance of attendances) {
        const { staff_id, status, notes } = attendance;

        const [result] = await connection.query(
          'INSERT INTO attendance (staff_id, site_id, date, status, notes) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = ?, notes = ?',
          [staff_id, site_id, date, status, notes, status, notes]
        );

        insertedIds.push(result.insertId);
      }

      await connection.commit();

      const [bulkAttendance] = await db.query(
        `SELECT a.*, s.staff_name, s.role, st.site_name 
         FROM attendance a 
         INNER JOIN staff s ON a.staff_id = s.id 
         INNER JOIN sites st ON a.site_id = st.id 
         WHERE a.site_id = ? AND a.date = ?`,
        [site_id, date]
      );

      successResponse(res, bulkAttendance, 'Bulk attendance created successfully', 201);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Bulk create attendance error:', error);
    errorResponse(res, 'Failed to create bulk attendance', 500);
  }
};
