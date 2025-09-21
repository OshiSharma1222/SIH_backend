const express = require('express');
const { verifyKYC, getTouristProfile } = require('../controllers/kycController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// KYC verification (no auth required for initial registration)
router.post('/verify', verifyKYC);

// Get tourist profile (requires authentication)
router.get('/:dtid', authenticateToken, getTouristProfile);

module.exports = router;