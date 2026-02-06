import { useState, useRef, useCallback, useEffect } from "react";

export function useTimeAnimation(playbackSpeed = 1) {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);

  // Track simulation time
  const simTimeRef = useRef(0);                 // Last simulation time
  const lastFrameRef = useRef(0);               // Timestamp of last frame
  const speedRef = useRef(playbackSpeed);       // Latest speed
  const startTimeRef = useRef(0);               // Track start time for accuracy
  const endTimeRef = useRef(0);                 // Track end time

  const FRAME_INTERVAL = 1000 / 30;             // Translate to 30 FPS 
  const BASE_SPEED = 480;                       // ms of simulation per 1ms real time

  // Update speed ref whenever playbackSpeed changes
  useEffect(() => {
    speedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    console.log("Animation stopped at time:", simTimeRef.current);
    simTimeRef.current = 0;
    lastFrameRef.current = 0;
    setIsAnimating(false);
  }, []);

  const animate = useCallback((startTime, endTime, onUpdate, onComplete) => {
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
      const delta = now - lastFrameRef.current;                 // calculate time passed since last frame
      const deltaSim = delta * BASE_SPEED * speedRef.current;   // convert to sim time to advance
      let newSimTime = simTimeRef.current + deltaSim;           // advance the simulation clock

      // Clamp to endTime
      if (newSimTime > endTime) newSimTime = endTime;

      // Wait for INTERVAL before calling onUpdate
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
        console.log("Animation has reached endTime:", endTimeRef.current);
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