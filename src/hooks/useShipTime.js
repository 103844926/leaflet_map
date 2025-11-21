import { useState, useMemo, useEffect, useRef } from "react";

export function useShipTime(
  ships,
  externalAvailableTimes,
  isAnimating,
  currentSimulatedTime,
  onTimeChange,
) {
  const computedTimes = useMemo(() => {
    const timeSet = new Set();
    ships.forEach((ship) =>
      ship.locations.forEach((loc) => timeSet.add(loc.time)),
    );
    return Array.from(timeSet).sort((a, b) => a - b);
  }, [ships]);

  const availableTimes = externalAvailableTimes || computedTimes;
  const [selectedTime, setSelectedTime] = useState(() =>
    availableTimes.length > 0
      ? availableTimes[availableTimes.length - 1]
      : null,
  );
  const initializedRef = useRef(false);

  const minTime = availableTimes[0] ?? null;
  const maxTime = availableTimes[availableTimes.length - 1] ?? null;

  useEffect(() => {
    if (!initializedRef.current && availableTimes.length > 0) {
      const initialTime = availableTimes[availableTimes.length - 1];
      setSelectedTime(initialTime);
      onTimeChange([availableTimes[0], initialTime]);
      initializedRef.current = true;
    }
  }, [availableTimes, onTimeChange]);

  useEffect(() => {
    if (currentSimulatedTime !== null) {
      setSelectedTime(currentSimulatedTime);
    }
  }, [currentSimulatedTime]);

  const updateTime = (timestamp) => {
    if (!availableTimes.length || timestamp == null) return;
    const clamped = Math.max(minTime, Math.min(maxTime, timestamp));
    setSelectedTime(clamped);
    onTimeChange([minTime, clamped]);
  };

  return {
    availableTimes,
    selectedTime,
    setSelectedTime,
    minTime,
    maxTime,
    updateTime,
  };
}
