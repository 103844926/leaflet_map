import { useState, useCallback, useMemo } from "react";
import { useTimeAnimation } from './useTimeAnimation';

// Base ShipPositions structure
function baseShipPosition(ship, time) {
  return {
    ship_uid: ship.ship_uid,
    time,
    index: 0,
    nextIndex: 0,
    progress: 0,
    position: null,
  };
}

// Calculate interpolation between two positions
function interpolatePosition(pos1, pos2, progress) {
  return {
    lat: pos1.lat + (pos2.lat - pos1.lat) * progress,
    long: pos1.long + (pos2.long - pos1.long) * progress,
    course: pos2.course, // Use the target course
  };
}

export function useShipAnimation(ships, selectedTime) {
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const { isAnimating, animate, stopAnimation } = useTimeAnimation(playbackSpeed);

  //Return ship positions based on current time
  const getShipPositionsAtTime = useCallback((currentTime) => {
    if (currentTime == null) {
      return ships.map(ship => baseShipPosition(ship, currentTime));
    }

    return ships.map((ship) => {
      if (!ship.locations?.length) {
        return baseShipPosition(ship, currentTime);
      }

      // Find the next position index
      let nextIndex = ship.locations.findIndex(loc => loc.time > currentTime);

      // If no future waypoint, return ship position at the last position
      if (nextIndex === -1) {
        const lastIndex = ship.locations.length - 1;
        const lastLoc = ship.locations[lastIndex];
        return {
          ...baseShipPosition(ship, currentTime),
          index: lastIndex,
          nextIndex: lastIndex,
          progress: 1,
          position: {
            lat: lastLoc.lat,
            long: lastLoc.long,
            course: lastLoc.course ?? 0,
          },
        };
      }

      // If at or before first waypoint, return at first position
      if (nextIndex === 0) {
        const first = ship.locations[0];
        return {
          ...baseShipPosition(ship, currentTime),
          index: 0,
          nextIndex: 1,
          progress: 0,
          position: {
            lat: first.lat,
            long: first.long,
            course: first.course ?? 0,
          },
        };
      }

      // Get previous and next locations
      const prevIndex = nextIndex - 1;
      const prevLoc = ship.locations[prevIndex];
      const nextLoc = ship.locations[nextIndex];

      // Calculate interpolation progress between two locations (0 to 1)
      const totalTime = nextLoc.time - prevLoc.time;
      const elapsedTime = currentTime - prevLoc.time;
      const progress = Math.min(1, Math.max(0, elapsedTime / totalTime));

      // Interpolate between the two positions
      const interpolatedPosition = interpolatePosition(prevLoc, nextLoc, progress);

      // Return the ship position structure
      return {
        ...baseShipPosition(ship, currentTime),
        index: prevIndex,
        nextIndex,
        progress,
        position: interpolatedPosition,
      };
    });
  }, [ships]);

  const animateShips = useCallback((currentTime, startAnimate, endAnimate, onTimeApply) => {
    // Start from current time, but clamp to startAnimate if it is at endAnimate
    console.log("Animation started from", currentTime, "to", endAnimate);
    let startTime = currentTime;
    if (startTime < startAnimate) startTime = startAnimate;
    if (startTime >= endAnimate) startTime = startAnimate;
    console.log("Already at", endAnimate, "restarting to", startAnimate);

    animate(
      startTime,
      endAnimate,
      (t) => {
        const clamped = Math.min(Math.max(t, startAnimate), endAnimate);
        // External callback to apply current time
        onTimeApply(clamped);
      },
      () => {
        console.log("Animation complete");
      }
    );
  }, [animate]);

  const shipPositions = useMemo(
    () => getShipPositionsAtTime(selectedTime),
    [getShipPositionsAtTime, selectedTime]
  );

  return {
    shipPositions,
    isAnimating,
    animate: animateShips,
    stopAnimation,
    playbackSpeed,
    setPlaybackSpeed,
  };
}