const { calculateDistance } = require('./geofencing');

const detectInactivity = (lastLocationTime, thresholdMinutes = 30) => {
  const now = new Date();
  const lastUpdate = new Date(lastLocationTime);
  const diffMinutes = (now - lastUpdate) / (1000 * 60);
  
  return {
    isAnomaly: diffMinutes > thresholdMinutes,
    type: 'inactivity',
    severity: diffMinutes > 60 ? 'high' : 'medium',
    details: {
      lastUpdateMinutes: Math.round(diffMinutes),
      threshold: thresholdMinutes
    }
  };
};

const detectRouteDeviation = (currentLat, currentLon, itineraries, deviationThresholdKm = 5) => {
  if (!itineraries || itineraries.length === 0) {
    return { isAnomaly: false };
  }

  const activeItinerary = itineraries.find(i => i.status === 'in_progress') || itineraries[0];
  const distance = calculateDistance(
    currentLat, currentLon,
    activeItinerary.destination_lat, activeItinerary.destination_lng
  ) / 1000; // Convert to km

  return {
    isAnomaly: distance > deviationThresholdKm,
    type: 'route_deviation',
    severity: distance > 10 ? 'high' : 'medium',
    details: {
      deviationKm: Math.round(distance * 100) / 100,
      threshold: deviationThresholdKm,
      destination: activeItinerary.destination_name
    }
  };
};

const detectAltitudeDrop = (locations, dropThresholdM = 100, timeThresholdMin = 2) => {
  if (locations.length < 2) {
    return { isAnomaly: false };
  }

  const latest = locations[0];
  const previous = locations[1];
  
  if (!latest.altitude || !previous.altitude) {
    return { isAnomaly: false };
  }

  const altitudeDiff = previous.altitude - latest.altitude;
  const timeDiff = (new Date(latest.timestamp) - new Date(previous.timestamp)) / (1000 * 60);

  return {
    isAnomaly: altitudeDiff > dropThresholdM && timeDiff <= timeThresholdMin,
    type: 'altitude_drop',
    severity: altitudeDiff > 200 ? 'critical' : 'high',
    details: {
      altitudeDropM: Math.round(altitudeDiff),
      timeMinutes: Math.round(timeDiff * 100) / 100,
      threshold: dropThresholdM
    }
  };
};

const detectSpeedAnomaly = (locations, speedThresholdKmh = 120) => {
  if (locations.length < 2) {
    return { isAnomaly: false };
  }

  const latest = locations[0];
  const previous = locations[1];

  const distance = calculateDistance(
    latest.latitude, latest.longitude,
    previous.latitude, previous.longitude
  );
  
  const timeDiff = (new Date(latest.timestamp) - new Date(previous.timestamp)) / (1000 * 3600); // hours
  const speedKmh = (distance / 1000) / timeDiff;

  return {
    isAnomaly: speedKmh > speedThresholdKmh,
    type: 'speed_anomaly',
    severity: speedKmh > 200 ? 'critical' : 'medium',
    details: {
      speedKmh: Math.round(speedKmh * 100) / 100,
      threshold: speedThresholdKmh
    }
  };
};

module.exports = {
  detectInactivity,
  detectRouteDeviation,
  detectAltitudeDrop,
  detectSpeedAnomaly
};