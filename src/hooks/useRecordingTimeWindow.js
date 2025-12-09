import { useState, useEffect, useCallback, useRef } from "react";

export function useRecordingTimeWindow({ minTime, maxTime, initialStartTime, showDialog }) {
  const [stagingStart, setStagingStart] = useState(minTime);
  const [stagingEnd, setStagingEnd] = useState(maxTime);

  // Track if we've already applied the initial start time for this dialog session
  const appliedInitialStartRef = useRef(false);

  // Reset the applied flag when dialog closes
  useEffect(() => {
    if (!showDialog) {
      appliedInitialStartRef.current = false;
    }
  }, [showDialog]);

  // First apply min/max when they change
  useEffect(() => {
    setStagingStart(minTime);
    setStagingEnd(maxTime);
  }, [minTime, maxTime]);

  // Apply initialStartTime when dialog opens and we have a value
  useEffect(() => {
    if (showDialog && initialStartTime != null && !appliedInitialStartRef.current) {
      console.log("🎯 Setting recording start time to:", new Date(initialStartTime).toLocaleString());
      setStagingStart(initialStartTime);
      appliedInitialStartRef.current = true;
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