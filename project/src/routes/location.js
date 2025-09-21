const express = require('express');
const { 
  updateLocation, 
  getLatestLocation, 
  getLocationHistory 
} = require('../controllers/locationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Update location (requires authentication)
router.post('/update', authenticateToken, updateLocation);

// Get latest location (requires authentication)
router.get('/:dtid', authenticateToken, getLatestLocation);

// Get location history (requires authentication)
router.get('/:dtid/history', authenticateToken, getLocationHistory);

module.exports = router;