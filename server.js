const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database
const db = require('./src/config/database');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const siteRoutes = require('./src/routes/siteRoutes');
const staffRoutes = require('./src/routes/staffRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const dprRoutes = require('./src/routes/dprRoutes');
const workTypeRoutes = require('./src/routes/workTypeRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dpr', dprRoutes);
app.use('/api/work-types', workTypeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Construction Management API is running',
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler middleware (should be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║  🏗️  Construction Management API          ║
  ║                                           ║
  ║  Server running on port: ${PORT}            ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}              ║
  ║                                           ║
  ║  API Documentation:                       ║
  ║  http://localhost:${PORT}                    ║
  ╚═══════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;
