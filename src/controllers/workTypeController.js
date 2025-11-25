const db = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Get all work types
exports.getAllWorkTypes = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM work_types WHERE is_active = TRUE ORDER BY work_name'
    );
    const workTypes = result.rows;
    successResponse(res, workTypes, 'Work types retrieved successfully');
  } catch (error) {
    console.error('Get work types error:', error);
    errorResponse(res, 'Failed to retrieve work types', 500);
  }
};

// Get single work type
exports.getWorkTypeById = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM work_types WHERE id = $1 AND is_active = TRUE',
      [req.params.id]
    );
    const workTypes = result.rows;

    if (workTypes.length === 0) {
      return errorResponse(res, 'Work type not found', 404);
    }

    successResponse(res, workTypes[0], 'Work type retrieved successfully');
  } catch (error) {
    console.error('Get work type error:', error);
    errorResponse(res, 'Failed to retrieve work type', 500);
  }
};

// Create work type
exports.createWorkType = async (req, res) => {
  try {
    const { work_name, unit, parameter } = req.body;

    if (!work_name || !unit) {
      return errorResponse(res, 'Work name and unit are required', 400);
    }

    const result = await db.query(
      'INSERT INTO work_types (work_name, unit, parameter) VALUES ($1, $2, $3) RETURNING id',
      [work_name, unit, parameter || 'Structure']
    );

    const newWorkTypeResult = await db.query('SELECT * FROM work_types WHERE id = $1', [result.rows[0].id]);
    const newWorkType = newWorkTypeResult.rows;

    successResponse(res, newWorkType[0], 'Work type created successfully', 201);
  } catch (error) {
    console.error('Create work type error:', error);
    errorResponse(res, 'Failed to create work type', 500);
  }
};

// Update work type
exports.updateWorkType = async (req, res) => {
  try {
    const { work_name, unit, parameter } = req.body;
    const { id } = req.params;

    const result = await db.query(
      'UPDATE work_types SET work_name = $1, unit = $2, parameter = $3 WHERE id = $4',
      [work_name, unit, parameter, id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Work type not found', 404);
    }

    const updatedWorkTypeResult = await db.query('SELECT * FROM work_types WHERE id = $1', [id]);
    const updatedWorkType = updatedWorkTypeResult.rows;

    successResponse(res, updatedWorkType[0], 'Work type updated successfully');
  } catch (error) {
    console.error('Update work type error:', error);
    errorResponse(res, 'Failed to update work type', 500);
  }
};

// Delete work type (soft delete)
exports.deleteWorkType = async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE work_types SET is_active = FALSE WHERE id = $1',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return errorResponse(res, 'Work type not found', 404);
    }

    successResponse(res, null, 'Work type deleted successfully');
  } catch (error) {
    console.error('Delete work type error:', error);
    errorResponse(res, 'Failed to delete work type', 500);
  }
};