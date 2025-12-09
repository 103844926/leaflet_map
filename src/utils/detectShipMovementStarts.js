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
  const R = 6371000; // Earth's radius in meters
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
 * Detect timestamps where ships start moving significantly
 * Works with your ship data structure: { ship_uid, locations: [{ lat, long, time }] }
 * 
 * @param {Array} ships - Array of ship objects with locations array
 * @param {number} threshold - Movement threshold in meters (default: 50m)
 * @returns {Array} Array of timestamps (time values) where ships start moving
 */
export function detectShipMovementStarts(ships, threshold = 50) {
  const movementTimestamps = new Set();

  ships.forEach(ship => {
    if (!ship.locations || ship.locations.length < 2) return;

    // Your data comes reversed from getShipData, but let's sort to be safe
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

      // If distance exceeds threshold, this is a movement start
      // Add the PREVIOUS timestamp (just before movement)
      if (distance >= threshold) {
        movementTimestamps.add(prev.time);
        break; // Only mark the first significant movement for each ship
      }
    }
  });

  // Return as sorted array
  return Array.from(movementTimestamps).sort((a, b) => a - b);
}

/**
 * Enhanced version that returns detailed information about each movement
 * @param {Array} ships - Array of ship objects with locations array
 * @param {number} threshold - Movement threshold in meters (default: 50m)
 * @returns {Array} Array of objects with time, ship_uid, distance info
 */
export function detectShipMovementStartsDetailed(ships, threshold = 50) {
  const movementMap = new Map();

  ships.forEach(ship => {
    if (!ship.locations || ship.locations.length < 2) return;

    const sortedLocations = [...ship.locations].sort((a, b) => a.time - b.time);

    for (let i = 1; i < sortedLocations.length; i++) {
      const prev = sortedLocations[i - 1];
      const curr = sortedLocations[i];

      const distance = calculateDistance(
        prev.lat,
        prev.long,
        curr.lat,
        curr.long
      );

      if (distance >= threshold) {
        movementMap.set(ship.ship_uid, {
          time: prev.time,
          timeFormatted: prev.timeFormatted,
          shipUid: ship.ship_uid,
          distance: Math.round(distance),
          fromCoords: { lat: prev.lat, lon: prev.long },
          toCoords: { lat: curr.lat, lon: curr.long },
          timeDiff: (curr.time - prev.time) / 1000 / 60,
          course: curr.course
        });
        break;
      }
    }
  });

  return movementMap;
}

/**
 * Helper: Convert Map to sorted array (for timeline marks)
 */
export function movementMapToArray(movementMap) {
  return Array.from(movementMap.values()).sort((a, b) => a.time - b.time);
}

/**
 * Helper: Get start time for a specific ship
 */
export function getShipStartTime(movementMap, shipUid) {
  return movementMap.get(shipUid)?.time ?? null;
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