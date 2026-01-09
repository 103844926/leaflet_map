import { useState, useCallback, useMemo } from "react";
import { useTimeAnimation } from './useTimeAnimation';

// Linearly interpolate between two positions
function interpolatePosition(pos1, pos2, progress) {
  return {
    lat: pos1.lat + (pos2.lat - pos1.lat) * progress,
    long: pos1.long + (pos2.long - pos1.long) * progress,
    course: pos2.course, // Use the target course
    speed: pos1.speed + (pos2.speed - pos1.speed) * progress,
  };
}

export function useShipAnimation(ships, selectedTime) {
  const [selectedShip, setSelectedShip] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const { isAnimating, animate, stopAnimation } = useTimeAnimation(playbackSpeed);

  // Calculate interpolated ship positions based on current time
  const getShipPositionsAtTime = useCallback((currentTime) => {
    if (!currentTime) return ships.map(() => ({ index: 0, position: null }));

    return ships.map((ship) => {
      if (!ship.locations?.length) {
        return { index: 0, position: null };
      }

      // Find the two waypoints to interpolate between
      let nextIndex = ship.locations.findIndex(loc => loc.time > currentTime);

      // If no future waypoint, ship is at the last position
      if (nextIndex === -1) {
        const lastIndex = ship.locations.length - 1;
        return {
          index: lastIndex,
          position: ship.locations[lastIndex]
        };
      }

      // If at or before first waypoint
      if (nextIndex === 0) {
        return {
          index: 0,
          position: ship.locations[0]
        };
      }

      const prevIndex = nextIndex - 1;
      const prevLoc = ship.locations[prevIndex];
      const nextLoc = ship.locations[nextIndex];

      // Calculate interpolation progress (0 to 1)
      const totalTime = nextLoc.time - prevLoc.time;
      const elapsedTime = currentTime - prevLoc.time;
      const progress = Math.min(1, Math.max(0, elapsedTime / totalTime));

      // Interpolate between the two positions
      const interpolatedPosition = interpolatePosition(prevLoc, nextLoc, progress);

      return {
        index: prevIndex,
        position: interpolatedPosition,
        nextIndex: nextIndex,
        progress: progress
      };
    });
  }, [ships]);

  const animateShips = useCallback((currentTime, minTime, maxTime, updateTime) => {
    // Start from current time, but clamp to minTime if it is at maxTime
    let startTime = currentTime;
    if (startTime < minTime) startTime = minTime;
    if (startTime >= maxTime) startTime = minTime;

    animate(
      startTime,
      maxTime,
      (t) => {
        // Clamp time on every frame (safety)
        const clamped = Math.min(Math.max(t, minTime), maxTime);
        updateTime(clamped);
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
    selectedShip,
    setSelectedShip,
    shipPositions,
    isAnimating,
    animate: animateShips,
    stopAnimation,
    playbackSpeed,
    setPlaybackSpeed,
  };
}