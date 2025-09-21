const { calculateSafetyScore } = require('../services/safetyScoreService');
const supabase = require('../config/database');

const getSafetyScore = async (req, res) => {
  try {
    const { dtid } = req.params;

    // Verify tourist exists
    const { data: tourist, error: touristError } = await supabase
      .from('tourists')
      .select('dtid, full_name')
      .eq('dtid', dtid)
      .single();

    if (touristError || !tourist) {
      return res.status(404).json({
        success: false,
        message: 'Tourist not found'
      });
    }

    // Calculate and get updated safety score
    const safetyScore = await calculateSafetyScore(dtid);

    // Get additional context
    const { data: activeAnomalies } = await supabase
      .from('anomalies')
      .select('anomaly_type, severity, detected_at')
      .eq('dtid', dtid)
      .eq('status', 'active');

    const { data: latestLocation } = await supabase
      .from('locations')
      .select('timestamp')
      .eq('dtid', dtid)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Determine risk level based on score
    let riskLevel = 'low';
    if (safetyScore.current_score < 30) riskLevel = 'critical';
    else if (safetyScore.current_score < 50) riskLevel = 'high';
    else if (safetyScore.current_score < 70) riskLevel = 'medium';

    res.json({
      success: true,
      data: {
        dtid: dtid,
        tourist_name: tourist.full_name,
        current_score: safetyScore.current_score,
        risk_level: riskLevel,
        factors: safetyScore.factors,
        last_updated: safetyScore.last_updated,
        active_anomalies_count: activeAnomalies ? activeAnomalies.length : 0,
        last_location_update: latestLocation?.timestamp || null,
        score_history: {
          // This could be expanded to track historical scores
          initial_score: 100,
          current_score: safetyScore.current_score,
          score_change: safetyScore.current_score - 100
        }
      }
    });

  } catch (error) {
    console.error('Get safety score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch safety score',
      error: error.message
    });
  }
};

const getAllSafetyScores = async (req, res) => {
  try {
    const { riskLevel, limit = 50 } = req.query;

    let query = supabase
      .from('safety_scores')
      .select(`
        *,
        tourists(dtid, full_name, contact_number)
      `)
      .order('current_score', { ascending: true })
      .limit(parseInt(limit));

    // Filter by risk level if specified
    if (riskLevel) {
      let scoreThreshold;
      switch (riskLevel) {
        case 'critical': scoreThreshold = [0, 30]; break;
        case 'high': scoreThreshold = [30, 50]; break;
        case 'medium': scoreThreshold = [50, 70]; break;
        case 'low': scoreThreshold = [70, 100]; break;
        default: scoreThreshold = null;
      }

      if (scoreThreshold) {
        query = query.gte('current_score', scoreThreshold[0])
                     .lt('current_score', scoreThreshold[1]);
      }
    }

    const { data: safetyScores, error } = await query;

    if (error) throw error;

    // Add risk level to each score
    const scoresWithRisk = (safetyScores || []).map(score => {
      let riskLevel = 'low';
      if (score.current_score < 30) riskLevel = 'critical';
      else if (score.current_score < 50) riskLevel = 'high';
      else if (score.current_score < 70) riskLevel = 'medium';

      return {
        ...score,
        risk_level: riskLevel
      };
    });

    res.json({
      success: true,
      data: scoresWithRisk
    });

  } catch (error) {
    console.error('Get all safety scores error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch safety scores',
      error: error.message
    });
  }
};

module.exports = {
  getSafetyScore,
  getAllSafetyScores
};