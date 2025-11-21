import { useState, useRef, useEffect, useCallback } from "react";

export function useShipAnimation(ships) {
  const [shipPositions, setShipPositions] = useState(ships.map(() => 0));
  const [selectedShipIndex, setSelectedShipIndex] = useState(null);

  const [isAnimatingAll, setIsAnimatingAll] = useState(false);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(null);
  const [currentSimulatedTime, setCurrentSimulatedTime] = useState(null);

  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  // ⚡ SPEED MULTIPLIER (adjust here)
  // Example: 960 = 24 hours simulated → 3 seconds real time
  const SPEED = 960;

  // Reset when ship data changes
  useEffect(() => {
    setShipPositions(ships.map(() => 0));
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimatingAll(false);
    setCurrentAnimationIndex(null);
    setCurrentSimulatedTime(null);
  }, [ships]);

  const animateAll = useCallback(
    (availableTimes, onRangeChange, startTime = null) => {
      // Toggle off
      if (isAnimatingAll) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        startTimeRef.current = null;
        setIsAnimatingAll(false);
        setCurrentAnimationIndex(null);
        setCurrentSimulatedTime(null);
        return;
      }

      // No data available
      if (!availableTimes || availableTimes.length === 0) return;

      const startSimTime = startTime ?? availableTimes[0];
      const endSimTime = availableTimes[availableTimes.length - 1];

      setIsAnimatingAll(true);
      startTimeRef.current = performance.now();

      const step = (now) => {
        const elapsed = now - startTimeRef.current;

        // Raw simulated time using stopwatch model
        const rawSimTime = startSimTime + elapsed * SPEED;

        // Clamped time to prevent overshoot
        const clampedSimTime = Math.min(rawSimTime, endSimTime);

        // If still within animation duration, update continuously
        if (rawSimTime < endSimTime) {
          setCurrentSimulatedTime(clampedSimTime);

          // Update ship positions
          const newPositions = ships.map((ship) => {
            const idx = ship.locations.findIndex(
              (loc) => loc.time > clampedSimTime,
            );
            return idx === -1
              ? ship.locations.length - 1
              : Math.max(0, idx - 1);
          });
          setShipPositions(newPositions);

          // Update time index
          const closestIdx = availableTimes.findIndex(
            (t) => t >= clampedSimTime,
          );
          setCurrentAnimationIndex(
            closestIdx === -1 ? availableTimes.length - 1 : closestIdx,
          );

          // Notify parent of range change
          if (onRangeChange) onRangeChange([startSimTime, clampedSimTime]);

          animationRef.current = requestAnimationFrame(step);
          return;
        }

        // ---- FINAL FRAME ----
        // We DO NOT use rawSimTime here. Only clamped endSimTime.
        setCurrentSimulatedTime(endSimTime);

        // Final ship positions
        setShipPositions(ships.map((ship) => ship.locations.length - 1));

        // Final cleanup
        animationRef.current = null;
        startTimeRef.current = null;
        setIsAnimatingAll(false);
        setCurrentAnimationIndex(null);

        // Notify parent with final exact time
        if (onRangeChange) onRangeChange([startSimTime, endSimTime]);
      };

      animationRef.current = requestAnimationFrame(step);
    },
    [isAnimatingAll, ships],
  );

  return {
    shipPositions,
    setShipPositions,
    selectedShipIndex,
    setSelectedShipIndex,
    animateAll,
    isAnimatingAll,
    currentAnimationIndex,
    currentSimulatedTime,
  };
}
