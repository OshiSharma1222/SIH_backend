const express = require('express');
const { 
  getQRCode, 
  scanQRCode, 
  verifyQRCode 
} = require('../controllers/qrController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get QR code image (no auth required for display)
router.get('/:dtid', getQRCode);

// Scan QR code (requires authentication - for police/authorities)
router.post('/scan', authenticateToken, scanQRCode);

// Verify QR code (no auth required for quick verification)
router.get('/verify/:dtid', verifyQRCode);

module.exports = router;