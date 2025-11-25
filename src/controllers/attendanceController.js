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
    let paramIndex = 1;

    if (site_id) {
      query += ` AND a.site_id = $${paramIndex}`;
      params.push(site_id);
      paramIndex++;
    }

    if (staff_id) {
      query += ` AND a.staff_id = $${paramIndex}`;
      params.push(staff_id);
      paramIndex++;
    }

    if (date) {
      query += ` AND a.date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND a.date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND a.date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ' ORDER BY a.date DESC, a.created_at DESC';

    const result = await db.query(query, params);
    const attendance = result.rows;
    successResponse(res, attendance, 'Attendance retrieved successfully');
  } catch (error) {
    console.error('Get attendance error:', error);
    errorResponse(res, 'Failed to retrieve attendance', 500);
  }
};

// Get single attendance
exports.getAttendanceById = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, s.staff_name, s.role, st.site_name 
       FROM attendance a 
       INNER JOIN staff s ON a.staff_id = s.id 
       INNER JOIN sites st ON a.site_id = st.id 
       WHERE a.id = $1`,
      [req.params.id]
    );
    const attendance = result.rows;

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

    const result = await db.query(
      'INSERT INTO attendance (staff_id, site_id, date, status, notes, photo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [staff_id, site_id, date, status, notes, photo]
    );

    const newAttendanceResult = await db.query(
      `SELECT a.*, s.staff_name, s.role, st.site_name 
       FROM attendance a 
       INNER JOIN staff s ON a.staff_id = s.id 
       INNER JOIN sites st ON a.site_id = st.id 
       WHERE a.id = $1`,
      [result.rows[0].id]
    );
    const newAttendance = newAttendanceResult.rows;

    successResponse(res, newAttendance[0], 'Attendance created successfully', 201);
  } catch (error) {
    console.error('Create attendance error:', error);
    if (error.code === '23505') { // PostgreSQL unique violation
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

    let query = 'UPDATE attendance SET staff_id = $1, site_id = $2, date = $3, status = $4, notes = $5';
    const params = [staff_id, site_id, date, status, notes];
    let paramIndex = 6;

    if (req.file) {
      query += `, photo = $${paramIndex}`;
      params.push(req.file.path);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex}`;
    params.push(id);

    const result = await db.query(query, params);

    if (result.rowCount === 0) {
      return errorResponse(res, 'Attendance not found', 404);
    }

    const updatedAttendanceResult = await db.query(
      `SELECT a.*, s.staff_name, s.role, st.site_name 
       FROM attendance a 
       INNER JOIN staff s ON a.staff_id = s.id 
       INNER JOIN sites st ON a.site_id = st.id 
       WHERE a.id = $1`,
      [id]
    );
    const updatedAttendance = updatedAttendanceResult.rows;

    successResponse(res, updatedAttendance[0], 'Attendance updated successfully');
  } catch (error) {
    console.error('Update attendance error:', error);
    errorResponse(res, 'Failed to update attendance', 500);
  }
};

// Delete attendance
exports.deleteAttendance = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM attendance WHERE id = $1', [req.params.id]);

    if (result.rowCount === 0) {
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

    const result = await db.query(
      `SELECT 
        status,
        COUNT(*) as count
      FROM attendance 
      WHERE site_id = $1 AND date BETWEEN $2 AND $3
      GROUP BY status`,
      [site_id, start_date, end_date]
    );
    const summary = result.rows;

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

    const client = await db.connect();
    
    try {
      await client.query('BEGIN');

      for (const attendance of attendances) {
        const { staff_id, status, notes } = attendance;

        await client.query(
          `INSERT INTO attendance (staff_id, site_id, date, status, notes) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (staff_id, site_id, date) 
           DO UPDATE SET status = $4, notes = $5`,
          [staff_id, site_id, date, status, notes]
        );
      }

      await client.query('COMMIT');

      const bulkAttendanceResult = await db.query(
        `SELECT a.*, s.staff_name, s.role, st.site_name 
         FROM attendance a 
         INNER JOIN staff s ON a.staff_id = s.id 
         INNER JOIN sites st ON a.site_id = st.id 
         WHERE a.site_id = $1 AND a.date = $2`,
        [site_id, date]
      );
      const bulkAttendance = bulkAttendanceResult.rows;

      successResponse(res, bulkAttendance, 'Bulk attendance created successfully', 201);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk create attendance error:', error);
    errorResponse(res, 'Failed to create bulk attendance', 500);
  }
};