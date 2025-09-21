const supabase = require('../config/database');
const { isInsideGeofence, findNearestZones } = require('../utils/geofencing');
const { updateSafetyScore } = require('../services/safetyScoreService');

const checkGeofence = async (req, res) => {
  try {
    const { dtid, currentLat, currentLong } = req.body;

    if (!dtid || !currentLat || !currentLong) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: dtid, currentLat, currentLong'
      });
    }

    // Get all active restricted zones
    const { data: zones, error: zonesError } = await supabase
      .from('restricted_zones')
      .select('*')
      .eq('is_active', true);

    if (zonesError) throw zonesError;

    let breachedZones = [];
    let nearbyZones = [];

    if (zones && zones.length > 0) {
      // Check for geofence breaches
      breachedZones = zones.filter(zone => 
        isInsideGeofence(currentLat, currentLong, zone.latitude, zone.longitude, zone.radius_meters)
      );

      // Find nearby zones (within 10km)
      nearbyZones = findNearestZones(currentLat, currentLong, zones, 10000)
        .filter(zone => !breachedZones.find(breach => breach.id === zone.id));
    }

    // If there's a breach, create an anomaly record and update safety score
    if (breachedZones.length > 0) {
      const highestRiskZone = breachedZones.reduce((prev, current) => {
        const riskOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        return (riskOrder[current.risk_level] > riskOrder[prev.risk_level]) ? current : prev;
      });

      // Create anomaly record
      await supabase
        .from('anomalies')
        .insert({
          dtid,
          anomaly_type: 'geofence_breach',
          severity: highestRiskZone.risk_level,
          description: `Entered restricted zone: ${highestRiskZone.name}`,
          latitude: currentLat,
          longitude: currentLong,
          metadata: {
            zone_id: highestRiskZone.id,
            zone_name: highestRiskZone.name,
            zone_type: highestRiskZone.zone_type
          }
        });

      // Update safety score
      const scoreDeduction = highestRiskZone.risk_level === 'critical' ? -30 : -20;
      await updateSafetyScore(dtid, scoreDeduction, 'geofence_breach');
    }

    res.json({
      success: true,
      data: {
        inside: breachedZones.length > 0,
        breached_zones: breachedZones,
        nearby_zones: nearbyZones.slice(0, 5), // Limit to 5 nearest zones
        risk_level: breachedZones.length > 0 ? 
          Math.max(...breachedZones.map(z => ({ low: 1, medium: 2, high: 3, critical: 4 })[z.risk_level])) : 0
      }
    });

  } catch (error) {
    console.error('Geofence check error:', error);
    res.status(500).json({
      success: false,
      message: 'Geofence check failed',
      error: error.message
    });
  }
};

const getRestrictedZones = async (req, res) => {
  try {
    const { data: zones, error } = await supabase
      .from('restricted_zones')
      .select('*')
      .eq('is_active', true)
      .order('risk_level', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: zones
    });

  } catch (error) {
    console.error('Get restricted zones error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restricted zones',
      error: error.message
    });
  }
};

module.exports = {
  checkGeofence,
  getRestrictedZones
};