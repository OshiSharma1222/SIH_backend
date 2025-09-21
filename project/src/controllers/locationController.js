const supabase = require('../config/database');
const { checkGeofence } = require('./geofenceController');

const updateLocation = async (req, res) => {
  try {
    const { dtid, latitude, longitude, altitude, accuracy, timestamp } = req.body;

    if (!dtid || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: dtid, latitude, longitude'
      });
    }

    // Verify tourist exists
    const { data: tourist, error: touristError } = await supabase
      .from('tourists')
      .select('dtid')
      .eq('dtid', dtid)
      .single();

    if (touristError || !tourist) {
      return res.status(404).json({
        success: false,
        message: 'Tourist not found'
      });
    }

    // Insert location record
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
        dtid,
        latitude,
        longitude,
        altitude: altitude || 0,
        accuracy: accuracy || null,
        timestamp: timestamp || new Date().toISOString()
      })
      .select()
      .single();

    if (locationError) throw locationError;

    // Automatically check geofence
    const geofenceCheck = await checkGeofenceInternal(dtid, latitude, longitude);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: location,
        geofence_status: geofenceCheck
      }
    });

  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({
      success: false,
      message: 'Location update failed',
      error: error.message
    });
  }
};

const getLatestLocation = async (req, res) => {
  try {
    const { dtid } = req.params;

    const { data: location, error } = await supabase
      .from('locations')
      .select('*')
      .eq('dtid', dtid)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !location) {
      return res.status(404).json({
        success: false,
        message: 'No location data found for this tourist'
      });
    }

    res.json({
      success: true,
      data: location
    });

  } catch (error) {
    console.error('Get latest location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location',
      error: error.message
    });
  }
};

const getLocationHistory = async (req, res) => {
  try {
    const { dtid } = req.params;
    const { limit = 50, from, to } = req.query;

    let query = supabase
      .from('locations')
      .select('*')
      .eq('dtid', dtid)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (from) {
      query = query.gte('timestamp', from);
    }
    
    if (to) {
      query = query.lte('timestamp', to);
    }

    const { data: locations, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: {
        locations: locations || [],
        count: locations?.length || 0
      }
    });

  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location history',
      error: error.message
    });
  }
};

// Internal function for automatic geofence checking
const checkGeofenceInternal = async (dtid, latitude, longitude) => {
  try {
    const { isInsideGeofence, findNearestZones } = require('../utils/geofencing');
    
    const { data: zones } = await supabase
      .from('restricted_zones')
      .select('*')
      .eq('is_active', true);

    if (!zones) return { inside: false, zones: [] };

    const breachedZones = zones.filter(zone => 
      isInsideGeofence(latitude, longitude, zone.latitude, zone.longitude, zone.radius_meters)
    );

    return {
      inside: breachedZones.length > 0,
      zones: breachedZones
    };
  } catch (error) {
    console.error('Internal geofence check error:', error);
    return { inside: false, zones: [] };
  }
};

module.exports = {
  updateLocation,
  getLatestLocation,
  getLocationHistory
};