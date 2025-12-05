import { useState, useEffect, useCallback } from "react";

export function useRecordingTimeWindow({ minTime, maxTime, initialStartTime, showDialog }) {
  const [stagingStart, setStagingStart] = useState(minTime);
  const [stagingEnd, setStagingEnd] = useState(maxTime);

  // First apply min/max
  useEffect(() => {
    setStagingStart(minTime);
    setStagingEnd(maxTime);
  }, [minTime, maxTime]);

  // THEN override using initialStartTime AFTER dialog opens
  useEffect(() => {
    if (showDialog && initialStartTime != null) {
      setStagingStart(initialStartTime);
    }
  }, [initialStartTime, showDialog]);

  // Reset function
  const resetTimeWindow = useCallback(() => {
    setStagingStart(initialStartTime ?? minTime);
    setStagingEnd(maxTime);
  }, [minTime, maxTime, initialStartTime]);

  return {
    stagingStart,
    stagingEnd,
    setStagingStart,
    setStagingEnd,
    resetTimeWindow
  };
}
