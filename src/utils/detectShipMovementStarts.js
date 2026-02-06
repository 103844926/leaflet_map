// @/utils/detectShipMovementStarts.js
// Utility to detect when ships transition from stationary to moving

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6378137; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Enhanced version that returns detailed information about each movement
 * @param {Array} ships - Array of ship objects with locations array
 * @param {number} threshold - Movement threshold in meters (default: 50m)
 * @returns {Map<string, Object>} Map keyed by ship_uid with movement start details
 */
export function detectShipMovementStarts(ships, threshold = 50) {
  const movementMap = new Map();

  ships.forEach(ship => {
    if (!ship.locations || ship.locations.length < 2) return;

    // Sort locations by time
    const sortedLocations = [...ship.locations].sort((a, b) => a.time - b.time);

    for (let i = 1; i < sortedLocations.length; i++) {
      const prev = sortedLocations[i - 1];
      const curr = sortedLocations[i];

      // Calculate distance moved
      const distance = calculateDistance(
        prev.lat,
        prev.long,
        curr.lat,
        curr.long
      );

      // If distance exceeds threshold, record movement start
      if (distance >= threshold) {
        movementMap.set(ship.ship_uid, {
          time: prev.time,
          timeFormatted: prev.timeFormatted,
          shipUid: ship.ship_uid,
        });
        break; // Only mark the first significant movement for each ship
      }
    }
  });

  return movementMap;
}

/**
 * Get all movement periods for a ship (not just the first one)
 * Useful for ships that stop and start multiple times
 * 
 * @param {Object} ship - Single ship object
 * @param {number} threshold - Movement threshold in meters
 * @param {number} stationaryThreshold - How long stationary before counting as "stopped" (ms)
 * @returns {Array} Array of movement start timestamps
 */
export function detectAllMovementStarts(ship, threshold = 50, stationaryThreshold = 600000) {
  if (!ship.locations || ship.locations.length < 2) return [];

  const movements = [];
  const sortedLocations = [...ship.locations].sort((a, b) => a.time - b.time);
  let wasStationary = true;

  for (let i = 1; i < sortedLocations.length; i++) {
    const prev = sortedLocations[i - 1];
    const curr = sortedLocations[i];

    const distance = calculateDistance(
      prev.lat,
      prev.long,
      curr.lat,
      curr.long
    );

    const timeDiff = curr.time - prev.time;

    if (distance >= threshold && wasStationary) {
      // Ship started moving after being stationary
      movements.push(prev.time);
      wasStationary = false;
    } else if (distance < threshold && timeDiff > stationaryThreshold) {
      // Ship has been stationary for a while
      wasStationary = true;
    }
  }

  return movements;
}