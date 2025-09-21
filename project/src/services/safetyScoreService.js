const supabase = require('../config/database');

const calculateSafetyScore = async (dtid) => {
  try {
    // Get current score
    const { data: currentScore } = await supabase
      .from('safety_scores')
      .select('*')
      .eq('dtid', dtid)
      .single();

    let score = currentScore?.current_score || 100;
    let factors = {};

    // Check for active anomalies
    const { data: anomalies } = await supabase
      .from('anomalies')
      .select('*')
      .eq('dtid', dtid)
      .eq('status', 'active');

    // Calculate score deductions based on anomalies
    if (anomalies && anomalies.length > 0) {
      anomalies.forEach(anomaly => {
        switch (anomaly.anomaly_type) {
          case 'inactivity':
            score -= anomaly.severity === 'high' ? 15 : 10;
            factors.inactivity = -10;
            break;
          case 'geofence_breach':
            score -= anomaly.severity === 'critical' ? 30 : 20;
            factors.geofence_breach = -20;
            break;
          case 'route_deviation':
            score -= 15;
            factors.route_deviation = -15;
            break;
          case 'altitude_drop':
            score -= anomaly.severity === 'critical' ? 40 : 25;
            factors.altitude_drop = -25;
            break;
          case 'speed_anomaly':
            score -= 10;
            factors.speed_anomaly = -10;
            break;
        }
      });
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, Math.min(100, score));

    // Update or insert safety score
    const { data, error } = await supabase
      .from('safety_scores')
      .upsert({
        dtid: dtid,
        current_score: score,
        factors: factors,
        last_updated: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Safety score calculation error:', error);
    throw error;
  }
};

const updateSafetyScore = async (dtid, scoreChange, reason) => {
  try {
    const { data: currentScore } = await supabase
      .from('safety_scores')
      .select('*')
      .eq('dtid', dtid)
      .single();

    let newScore = (currentScore?.current_score || 100) + scoreChange;
    newScore = Math.max(0, Math.min(100, newScore));

    let factors = currentScore?.factors || {};
    factors[reason] = scoreChange;

    const { data, error } = await supabase
      .from('safety_scores')
      .upsert({
        dtid: dtid,
        current_score: newScore,
        factors: factors,
        last_updated: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Safety score update error:', error);
    throw error;
  }
};

module.exports = {
  calculateSafetyScore,
  updateSafetyScore
};