const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const truckRoutes = require('./routes/trucks');
const checkoutRoutes = require('./routes/checkouts');

// Init app
const app = express();
const port = process.env.PORT || 3000;

// ============ MIDDLEWARE ============
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'SITAG Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/checkouts', checkoutRoutes);

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ============ START SERVER ============
app.listen(port, () => {
  console.log(`\n✓ SITAG Backend Server running on port ${port}`);
  console.log(`✓ http://localhost:${port}`);
  console.log(`✓ API Docs:`);
  console.log(`  - GET  /api/auth/login - User login`);
  console.log(`  - GET  /api/trucks - Get all trucks`);
  console.log(`  - POST /api/trucks - Create truck entry`);
  console.log(`  - GET  /api/checkouts - Get all checkouts`);
  console.log(`  - POST /api/checkouts - Create checkout entry\n`);
});
