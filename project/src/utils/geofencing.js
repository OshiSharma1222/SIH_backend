// Haversine formula for calculating distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

const isInsideGeofence = (currentLat, currentLon, zoneLat, zoneLon, radius) => {
  const distance = calculateDistance(currentLat, currentLon, zoneLat, zoneLon);
  return distance <= radius;
};

const findNearestZones = (currentLat, currentLon, zones, maxDistance = 50000) => {
  return zones
    .map(zone => ({
      ...zone,
      distance: calculateDistance(currentLat, currentLon, zone.latitude, zone.longitude)
    }))
    .filter(zone => zone.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
};

const checkGeofenceBreach = async (currentLat, currentLon) => {
  const supabase = require('../config/database');
  
  try {
    // Get all active restricted zones
    const { data: zones, error } = await supabase
      .from('restricted_zones')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    // Check if current location is inside any restricted zone
    for (const zone of zones || []) {
      const distance = calculateDistance(currentLat, currentLon, zone.latitude, zone.longitude);
      
      if (distance <= zone.radius_meters) {
        return {
          isAnomaly: true,
          type: 'geofence_breach',
          severity: zone.risk_level,
          details: {
            zoneName: zone.name,
            zoneType: zone.zone_type,
            riskLevel: zone.risk_level,
            distanceMeters: Math.round(distance),
            zoneRadius: zone.radius_meters
          }
        };
      }
    }

    return { isAnomaly: false };
  } catch (error) {
    console.error('Geofence breach check error:', error);
    return { isAnomaly: false };
  }
};

module.exports = {
  calculateDistance,
  isInsideGeofence,
  findNearestZones,
  checkGeofenceBreach
};