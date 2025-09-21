const express = require('express');
const { 
  getTouristClusters, 
  getActiveAlerts, 
  getDashboardStats 
} = require('../controllers/dashboardController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All dashboard routes require admin access
router.use(authenticateToken, requireAdmin);

// Get tourist clusters for heatmap
router.get('/clusters', getTouristClusters);

// Get active alerts
router.get('/alerts', getActiveAlerts);

// Get dashboard statistics
router.get('/stats', getDashboardStats);

module.exports = router;