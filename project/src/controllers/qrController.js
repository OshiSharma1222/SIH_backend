const path = require('path');
const fs = require('fs').promises;
const supabase = require('../config/database');
const { decodeQRData } = require('../utils/qrCode');

const getQRCode = async (req, res) => {
  try {
    const { dtid } = req.params;

    // Verify tourist exists
    const { data: tourist, error } = await supabase
      .from('tourists')
      .select('qr_code_url, full_name')
      .eq('dtid', dtid)
      .single();

    if (error || !tourist) {
      return res.status(404).json({
        success: false,
        message: 'Tourist not found'
      });
    }

    if (!tourist.qr_code_url) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found for this tourist'
      });
    }

    const qrPath = path.join(__dirname, '../../public', tourist.qr_code_url);
    
    try {
      await fs.access(qrPath);
      res.sendFile(path.resolve(qrPath));
    } catch (fileError) {
      res.status(404).json({
        success: false,
        message: 'QR code image file not found'
      });
    }

  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch QR code',
      error: error.message
    });
  }
};

const scanQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR data is required'
      });
    }

    // Decode QR data
    let decodedData;
    try {
      decodedData = decodeQRData(qrData);
    } catch (decodeError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    const { dtid } = decodedData;

    if (!dtid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code: DTID not found'
      });
    }

    // Get tourist details
    const { data: tourist, error } = await supabase
      .from('tourists')
      .select(`
        *,
        safety_scores(*),
        locations(latitude, longitude, timestamp)
      `)
      .eq('dtid', dtid)
      .single();

    if (error || !tourist) {
      return res.status(404).json({
        success: false,
        message: 'Tourist not found'
      });
    }

    // Get latest location
    const { data: latestLocation } = await supabase
      .from('locations')
      .select('*')
      .eq('dtid', dtid)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Get active anomalies
    const { data: activeAnomalies } = await supabase
      .from('anomalies')
      .select('*')
      .eq('dtid', dtid)
      .eq('status', 'active');

    res.json({
      success: true,
      message: 'QR code scanned successfully',
      data: {
        tourist: {
          dtid: tourist.dtid,
          full_name: tourist.full_name,
          contact_number: tourist.contact_number,
          emergency_contact_1: tourist.emergency_contact_1,
          emergency_contact_2: tourist.emergency_contact_2,
          nationality: tourist.nationality,
          kyc_status: tourist.kyc_status
        },
        safety_score: tourist.safety_scores?.[0]?.current_score || 100,
        latest_location: latestLocation,
        active_anomalies: activeAnomalies || [],
        scan_timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({
      success: false,
      message: 'QR scan failed',
      error: error.message
    });
  }
};

const verifyQRCode = async (req, res) => {
  try {
    const { dtid } = req.params;

    const { data: tourist, error } = await supabase
      .from('tourists')
      .select('dtid, full_name, kyc_status, created_at')
      .eq('dtid', dtid)
      .single();

    if (error || !tourist) {
      return res.status(404).json({
        success: false,
        message: 'Invalid DTID'
      });
    }

    res.json({
      success: true,
      message: 'DTID verified successfully',
      data: {
        dtid: tourist.dtid,
        full_name: tourist.full_name,
        kyc_status: tourist.kyc_status,
        registered_at: tourist.created_at,
        verified_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('QR verification error:', error);
    res.status(500).json({
      success: false,
      message: 'QR verification failed',
      error: error.message
    });
  }
};

module.exports = {
  getQRCode,
  scanQRCode,
  verifyQRCode
};