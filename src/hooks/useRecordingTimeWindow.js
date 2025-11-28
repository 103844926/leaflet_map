import { useState, useEffect, useCallback } from "react";

export function useRecordingTimeWindow({ minTime, maxTime }) {
  const [stagingStart, setStagingStart] = useState(minTime);
  const [stagingEnd, setStagingEnd] = useState(maxTime);

  // Sync staging with min/max changes
  useEffect(() => {
    setStagingStart(minTime);
    setStagingEnd(maxTime);
  }, [minTime, maxTime]);

  const resetTimeWindow = useCallback(() => {
    setStagingStart(minTime);
    setStagingEnd(maxTime);
  }, [minTime, maxTime]);

  return {
    stagingStart,
    stagingEnd,
    setStagingStart,
    setStagingEnd,
    resetTimeWindow
  };
}