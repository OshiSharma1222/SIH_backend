const supabase = require('../config/database');
const { calculateDistance } = require('../utils/geofencing');

const getTouristClusters = async (req, res) => {
  try {
    const { radius = 5000 } = req.query; // Default 5km radius for clustering

    // Get all latest locations
    const { data: locations, error } = await supabase
      .from('locations')
      .select(`
        dtid,
        latitude,
        longitude,
        timestamp,
        tourists(full_name, contact_number)
      `)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Get unique latest locations per tourist
    const latestLocations = {};
    (locations || []).forEach(location => {
      if (!latestLocations[location.dtid] || 
          new Date(location.timestamp) > new Date(latestLocations[location.dtid].timestamp)) {
        latestLocations[location.dtid] = location;
      }
    });

    const uniqueLocations = Object.values(latestLocations);

    // Simple clustering algorithm
    const clusters = [];
    const processed = new Set();

    uniqueLocations.forEach(location => {
      if (processed.has(location.dtid)) return;

      const cluster = {
        center_lat: location.latitude,
        center_lng: location.longitude,
        tourists: [location],
        count: 1
      };

      // Find nearby tourists
      uniqueLocations.forEach(otherLocation => {
        if (location.dtid !== otherLocation.dtid && !processed.has(otherLocation.dtid)) {
          const distance = calculateDistance(
            location.latitude, location.longitude,
            otherLocation.latitude, otherLocation.longitude
          );

          if (distance <= radius) {
            cluster.tourists.push(otherLocation);
            cluster.count++;
            processed.add(otherLocation.dtid);
          }
        }
      });

      // Calculate cluster center (average position)
      if (cluster.count > 1) {
        const avgLat = cluster.tourists.reduce((sum, t) => sum + t.latitude, 0) / cluster.count;
        const avgLng = cluster.tourists.reduce((sum, t) => sum + t.longitude, 0) / cluster.count;
        cluster.center_lat = avgLat;
        cluster.center_lng = avgLng;
      }

      clusters.push(cluster);
      processed.add(location.dtid);
    });

    res.json({
      success: true,
      data: {
        clusters: clusters,
        total_tourists: uniqueLocations.length,
        cluster_count: clusters.length,
        clustering_radius_m: parseInt(radius)
      }
    });

  } catch (error) {
    console.error('Get tourist clusters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tourist clusters',
      error: error.message
    });
  }
};

const getActiveAlerts = async (req, res) => {
  try {
    const { severity, limit = 100 } = req.query;

    // Get active anomalies
    let anomalyQuery = supabase
      .from('anomalies')
      .select(`
        *,
        tourists(full_name, contact_number, emergency_contact_1)
      `)
      .eq('status', 'active')
      .order('detected_at', { ascending: false });

    if (severity) {
      anomalyQuery = anomalyQuery.eq('severity', severity);
    }

    if (limit) {
      anomalyQuery = anomalyQuery.limit(parseInt(limit));
    }

    const { data: anomalies, error: anomalyError } = await anomalyQuery;

    if (anomalyError) throw anomalyError;

    // Get tourists in restricted zones (current geofence breaches)
    const { data: geofenceBreaches, error: geofenceError } = await supabase
      .from('anomalies')
      .select(`
        *,
        tourists(full_name, contact_number, emergency_contact_1)
      `)
      .eq('status', 'active')
      .eq('anomaly_type', 'geofence_breach')
      .order('detected_at', { ascending: false });

    if (geofenceError) throw geofenceError;

    // Get tourists with low safety scores
    const { data: lowScores, error: scoreError } = await supabase
      .from('safety_scores')
      .select(`
        *,
        tourists(dtid, full_name, contact_number, emergency_contact_1)
      `)
      .lt('current_score', 50)
      .order('current_score', { ascending: true });

    if (scoreError) throw scoreError;

    // Categorize alerts by priority
    const criticalAlerts = (anomalies || []).filter(a => a.severity === 'critical');
    const highAlerts = (anomalies || []).filter(a => a.severity === 'high');
    const mediumAlerts = (anomalies || []).filter(a => a.severity === 'medium');

    res.json({
      success: true,
      data: {
        summary: {
          total_alerts: (anomalies || []).length,
          critical_count: criticalAlerts.length,
          high_count: highAlerts.length,
          medium_count: mediumAlerts.length,
          geofence_breaches: (geofenceBreaches || []).length,
          low_safety_scores: (lowScores || []).length
        },
        alerts: {
          critical: criticalAlerts,
          high: highAlerts,
          medium: mediumAlerts,
          geofence_breaches: geofenceBreaches || [],
          low_safety_scores: (lowScores || []).map(score => ({
            ...score,
            alert_type: 'low_safety_score'
          }))
        }
      }
    });

  } catch (error) {
    console.error('Get active alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active alerts',
      error: error.message
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Get total tourists
    const { count: totalTourists, error: touristError } = await supabase
      .from('tourists')
      .select('*', { count: 'exact' });

    if (touristError) throw touristError;

    // Get active anomalies count
    const { count: activeAnomalies, error: anomalyError } = await supabase
      .from('anomalies')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    if (anomalyError) throw anomalyError;

    // Get tourists with recent location updates (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: activeTourists, error: activeError } = await supabase
      .from('locations')
      .select('dtid', { count: 'exact' })
      .gte('timestamp', oneHourAgo);

    if (activeError) throw activeError;

    // Get restricted zones count
    const { count: restrictedZones, error: zonesError } = await supabase
      .from('restricted_zones')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (zonesError) throw zonesError;

    // Get safety score distribution
    const { data: safetyScores, error: scoresError } = await supabase
      .from('safety_scores')
      .select('current_score');

    if (scoresError) throw scoresError;

    const scoreDistribution = {
      critical: 0, // 0-30
      high: 0,     // 30-50
      medium: 0,   // 50-70
      low: 0       // 70-100
    };

    (safetyScores || []).forEach(score => {
      if (score.current_score < 30) scoreDistribution.critical++;
      else if (score.current_score < 50) scoreDistribution.high++;
      else if (score.current_score < 70) scoreDistribution.medium++;
      else scoreDistribution.low++;
    });

    res.json({
      success: true,
      data: {
        overview: {
          total_tourists: totalTourists || 0,
          active_tourists: activeTourists || 0,
          active_anomalies: activeAnomalies || 0,
          restricted_zones: restrictedZones || 0
        },
        safety_score_distribution: scoreDistribution,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

module.exports = {
  getTouristClusters,
  getActiveAlerts,
  getDashboardStats
};