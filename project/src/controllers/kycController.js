const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/database');
const { generateQRCode } = require('../utils/qrCode');
const { generateToken } = require('../config/auth');

const verifyKYC = async (req, res) => {
  try {
    const {
      aadhaar_number,
      passport_number,
      full_name,
      date_of_birth,
      contact_number,
      email,
      emergency_contact_1,
      emergency_contact_2,
      nationality,
      itinerary
    } = req.body;

    // Validation
    if (!full_name || !date_of_birth || !contact_number || !emergency_contact_1) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: full_name, date_of_birth, contact_number, emergency_contact_1'
      });
    }

    if (!aadhaar_number && !passport_number) {
      return res.status(400).json({
        success: false,
        message: 'Either Aadhaar number or Passport number is required'
      });
    }

    // Generate DTID
    const dtid = `DTID-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Mock KYC verification (in real implementation, integrate with government APIs)
    const kycStatus = 'verified';

    // Generate QR Code
    const qrCodeUrl = await generateQRCode(dtid, {
      name: full_name,
      nationality: nationality || 'India'
    });

    // Insert tourist data
    const { data: tourist, error: touristError } = await supabase
      .from('tourists')
      .insert({
        dtid,
        aadhaar_number,
        passport_number,
        full_name,
        date_of_birth,
        contact_number,
        email,
        emergency_contact_1,
        emergency_contact_2,
        nationality: nationality || 'India',
        qr_code_url: qrCodeUrl,
        kyc_status: kycStatus
      })
      .select()
      .single();

    if (touristError) throw touristError;

    // Insert itinerary if provided
    if (itinerary && Array.isArray(itinerary)) {
      const itineraryData = itinerary.map(item => ({
        dtid,
        destination_name: item.destination_name,
        destination_lat: item.destination_lat,
        destination_lng: item.destination_lng,
        planned_arrival: item.planned_arrival,
        planned_departure: item.planned_departure
      }));

      const { error: itineraryError } = await supabase
        .from('itineraries')
        .insert(itineraryData);

      if (itineraryError) throw itineraryError;
    }

    // Initialize safety score
    await supabase
      .from('safety_scores')
      .insert({
        dtid,
        current_score: 100,
        factors: {}
      });

    // Generate JWT token for the tourist
    const token = generateToken({
      dtid: dtid,
      name: full_name,
      role: 'tourist'
    });

    res.status(201).json({
      success: true,
      message: 'KYC verification completed successfully',
      data: {
        dtid: dtid,
        qr_code_url: qrCodeUrl,
        status: kycStatus,
        tourist: tourist,
        token: token
      }
    });

  } catch (error) {
    console.error('KYC verification error:', error);
    res.status(500).json({
      success: false,
      message: 'KYC verification failed',
      error: error.message
    });
  }
};

const getTouristProfile = async (req, res) => {
  try {
    const { dtid } = req.params;

    const { data: tourist, error } = await supabase
      .from('tourists')
      .select(`
        *,
        itineraries(*),
        safety_scores(*)
      `)
      .eq('dtid', dtid)
      .single();

    if (error || !tourist) {
      return res.status(404).json({
        success: false,
        message: 'Tourist not found'
      });
    }

    res.json({
      success: true,
      data: tourist
    });

  } catch (error) {
    console.error('Get tourist profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tourist profile',
      error: error.message
    });
  }
};

module.exports = {
  verifyKYC,
  getTouristProfile
};