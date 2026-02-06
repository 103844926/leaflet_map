import { useState, useEffect, useCallback, useRef } from "react";

export function useRecordingTimeWindow({ minTime, maxTime, initialStartTime, showDialog }) {
  const [stagingStart, setStagingStart] = useState(null);
  const [stagingEnd, setStagingEnd] = useState(null);

  // Track if we've already applied the initial start time for this dialog session
  const appliedInitialStartRef = useRef(false);

  // Reset the applied flag when dialog closes
  useEffect(() => {
    if (!showDialog) {
      appliedInitialStartRef.current = false;
    }
  }, [showDialog]);

  // Apply min/max when open
  useEffect(() => {
    setStagingStart(minTime);
    setStagingEnd(maxTime);
  }, [minTime, maxTime]);

  // Apply initialStartTime when a ship with initialStartTime is applied
  useEffect(() => {
    if (showDialog && initialStartTime != null && !appliedInitialStartRef.current) {
      console.log(" Setting recording start time to:", new Date(initialStartTime).toLocaleString());
      setStagingStart(initialStartTime);
      appliedInitialStartRef.current = true;
    }
  }, [initialStartTime, showDialog]);

  // Reset function
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