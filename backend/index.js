require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const truckRoutes = require('./routes/trucks');
const checkoutRoutes = require('./routes/checkouts');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');

// Init app
const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

// ============ MIDDLEWARE ============
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    message: 'SITAG Backend API',
    version: '1.0.0',
    status: 'running',
  });
});

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/checkouts', checkoutRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  // Let React Router handle non-API routes in production.
  app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
    res.sendFile(frontendIndexPath);
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'SITAG Backend API',
      version: '1.0.0',
      status: 'running',
      frontend: 'Build frontend terlebih dahulu untuk melayani UI dari backend',
    });
  });
}

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// ============ 404 HANDLER ============
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
  });
});

// ============ START SERVER ============
app.listen(port, host, () => {
  console.log(`\n[OK] SITAG Backend Server running on port ${port}`);
  console.log(`[OK] http://localhost:${port}`);
  console.log(`[OK] API Docs:`);
  console.log('  - POST /api/auth/login - User login');
  console.log('  - GET  /api/trucks - Get all trucks');
  console.log('  - POST /api/trucks - Create truck entry');
  console.log('  - GET  /api/checkouts - Get all checkouts');
  console.log('  - POST /api/checkouts - Create checkout entry\n');
});
