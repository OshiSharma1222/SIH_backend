const express = require('express');
const { 
  getSafetyScore, 
  getAllSafetyScores 
} = require('../controllers/safetyScoreController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get safety score for a tourist (requires authentication)
router.get('/:dtid', authenticateToken, getSafetyScore);

// Get all safety scores (requires admin access)
router.get('/', authenticateToken, requireAdmin, getAllSafetyScores);

module.exports = router;