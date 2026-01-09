import { useState, useMemo, useEffect, useRef, useCallback } from "react";

export function useShipTime(ships, onTimeChange) {
  const [selectedTime, setSelectedTime] = useState(null);
  const initializedRef = useRef(false);

  // Compute available times from ships
  const availableTimes = useMemo(() => {
    const timeSet = new Set();
    ships.forEach((ship) =>
      ship.locations.forEach((loc) => timeSet.add(loc.time)),
    );
    return Array.from(timeSet).sort((a, b) => a - b);
  }, [ships]);

  const minTime = availableTimes[0] ?? null;
  const maxTime = availableTimes[availableTimes.length - 1] ?? null;

  const prevMaxRef = useRef(maxTime);
  const prevMinRef = useRef(minTime);

  // Initialize to latest time
  useEffect(() => {
    if (!initializedRef.current && availableTimes.length > 0) {
      const initialTime = availableTimes[availableTimes.length - 1];
      setSelectedTime(initialTime);
      onTimeChange([availableTimes[0], initialTime]);
      initializedRef.current = true;
    }
  }, [availableTimes, onTimeChange]);

  // Handle new data arrival
  useEffect(() => {
    if (!initializedRef.current || availableTimes.length === 0) return;

    let newSelectedTime = selectedTime;
    let shouldUpdate = false;

    // New data arrived — jump to latest
    if (maxTime > prevMaxRef.current) {
      newSelectedTime = maxTime;
      shouldUpdate = true;
    }
    // Old data deleted — clamp to new min if needed
    else if (minTime > prevMinRef.current && selectedTime < minTime) {
      newSelectedTime = minTime;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      setSelectedTime(newSelectedTime);
      onTimeChange([minTime, newSelectedTime]);
    }

    prevMaxRef.current = maxTime;
    prevMinRef.current = minTime;
  }, [maxTime, minTime, availableTimes.length, onTimeChange, selectedTime]);

  // Selected Time update (Important!!)
  const updateTime = useCallback(
    (timestamp) => {
      if (!availableTimes.length || timestamp == null) return;

      const clamped = Math.max(minTime, Math.min(maxTime, timestamp));
      setSelectedTime(clamped);
      onTimeChange([minTime, clamped]);
    },
    [availableTimes.length, minTime, maxTime, onTimeChange],
  );

  const updateTimeSafely = useCallback(
    (newTime, isAnimating, stopAnimation) => {
      if (isAnimating) stopAnimation();
      updateTime(newTime);
    },
    [updateTime]
  );

  return {
    availableTimes,
    selectedTime,
    setSelectedTime,
    minTime,
    maxTime,
    updateTime,
    updateTimeSafely,
  };
}
