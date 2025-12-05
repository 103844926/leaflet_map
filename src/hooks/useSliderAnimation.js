import { useState, useRef, useCallback, useEffect } from "react";

export function useSliderAnimation(playbackSpeed = 1) {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);

  // Track simulation time
  const simTimeRef = useRef(0); // Last simulation time
  const lastFrameRef = useRef(0); // Timestamp of last frame
  const speedRef = useRef(playbackSpeed); // Latest speed
  const startTimeRef = useRef(0); // Track start time for accuracy
  const endTimeRef = useRef(0); // Track end time

  const FRAME_INTERVAL = 1000 / 30; // ~30 FPS to match recording
  const BASE_SPEED = 480; // ms of simulation per 1ms real time

  // Update speed ref whenever playbackSpeed changes
  useEffect(() => {
    speedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    simTimeRef.current = 0;
    lastFrameRef.current = 0;
    setIsAnimating(false);
  }, []);

  const animate = useCallback(
    (startTime, endTime, onUpdate, onComplete) => {
      if (isAnimating) {
        stopAnimation();
        return;
      }
      if (startTime == null || endTime == null || startTime >= endTime) return;

      setIsAnimating(true);
      simTimeRef.current = startTime;
      startTimeRef.current = startTime;
      endTimeRef.current = endTime;
      lastFrameRef.current = performance.now();

      // Call onUpdate immediately with startTime to ensure first frame is correct
      onUpdate(startTime);

      const loop = (now) => {
        const delta = now - lastFrameRef.current; // ms since last frame
        const deltaSim = delta * BASE_SPEED * speedRef.current; // sim ms to advance
        let newSimTime = simTimeRef.current + deltaSim;

        // Clamp to endTime
        if (newSimTime > endTime) newSimTime = endTime;

        // Throttle UI updates but ensure smooth progression
        if (
          now - lastFrameRef.current >= FRAME_INTERVAL ||
          newSimTime === endTime
        ) {
          onUpdate(newSimTime);
          lastFrameRef.current = now;
        }

        simTimeRef.current = newSimTime;

        // Continue until we reach or exceed endTime
        if (newSimTime < endTime) {
          animationRef.current = requestAnimationFrame(loop);
        } else {
          // Make sure we call onUpdate with exact endTime
          if (Math.abs(newSimTime - endTime) > 1) {
            onUpdate(endTime);
          }
          stopAnimation();
          if (onComplete) onComplete();
        }
      };

      animationRef.current = requestAnimationFrame(loop);
    },
    [FRAME_INTERVAL, isAnimating, stopAnimation],
  );

  return {
    isAnimating,
    animate,
    stopAnimation,
  };
}