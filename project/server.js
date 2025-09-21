const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Serve static files (for QR codes)
app.use('/qr-codes', express.static(path.join(__dirname, 'public/qr-codes')));

// Routes
app.use('/auth', require('./src/routes/auth'));
app.use('/kyc', require('./src/routes/kyc'));
app.use('/geofence', require('./src/routes/geofence'));
app.use('/location', require('./src/routes/location'));
app.use('/anomaly', require('./src/routes/anomaly'));
app.use('/qr', require('./src/routes/qr'));
app.use('/safety-score', require('./src/routes/safetyScore'));
app.use('/dashboard', require('./src/routes/dashboard'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Tourist Safety Monitoring API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Tourist Safety Monitoring & Incident Response System API',
    version: '1.0.0',
    endpoints: {
      authentication: {
        'POST /auth/admin/login': 'Admin login',
        'POST /auth/refresh': 'Tourist token refresh'
      },
      kyc: {
        'POST /kyc/verify': 'KYC verification and DTID generation',
        'GET /kyc/:dtid': 'Get tourist profile'
      },
      geofencing: {
        'POST /geofence/check': 'Check if tourist is in restricted zone',
        'GET /geofence/zones': 'Get all restricted zones'
      },
      location: {
        'POST /location/update': 'Update tourist location',
        'GET /location/:dtid': 'Get latest location',
        'GET /location/:dtid/history': 'Get location history'
      },
      anomaly: {
        'GET /anomaly/:dtid': 'Check anomalies for tourist',
        'PUT /anomaly/:anomalyId/resolve': 'Resolve anomaly (admin)',
        'GET /anomaly': 'Get all anomalies (admin)'
      },
      qr: {
        'GET /qr/:dtid': 'Get QR code image',
        'POST /qr/scan': 'Scan QR code',
        'GET /qr/verify/:dtid': 'Verify QR code'
      },
      safety_score: {
        'GET /safety-score/:dtid': 'Get safety score',
        'GET /safety-score': 'Get all safety scores (admin)'
      },
      dashboard: {
        'GET /dashboard/clusters': 'Get tourist clusters (admin)',
        'GET /dashboard/alerts': 'Get active alerts (admin)',
        'GET /dashboard/stats': 'Get dashboard statistics (admin)'
      }
    },
    authentication: {
      header: 'Authorization: Bearer <token>',
      admin_credentials: {
        username: 'admin',
        password: 'admin123'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Smart Tourist Safety Monitoring API Server is running on port ${PORT}`);
  console.log(`📍 API Documentation: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Admin Login: POST http://localhost:${PORT}/auth/admin/login`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;