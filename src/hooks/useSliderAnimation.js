import { useState, useRef, useCallback, useEffect } from "react";

export function useSliderAnimation(playbackSpeed = 1) {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);

  // Track simulation time
  const simTimeRef = useRef(0); // Last simulation time
  const lastFrameRef = useRef(0); // Timestamp of last frame
  const speedRef = useRef(playbackSpeed); // Latest speed

  const FRAME_INTERVAL = 1000 / 20; // ~20 FPS
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
      lastFrameRef.current = performance.now();

      const loop = (now) => {
        const delta = now - lastFrameRef.current; // ms since last frame
        const deltaSim = delta * BASE_SPEED * speedRef.current; // sim ms to advance
        let newSimTime = simTimeRef.current + deltaSim;

        // Clamp to endTime
        if (newSimTime > endTime) newSimTime = endTime;

        // Throttle UI updates
        if (
          now - lastFrameRef.current >= FRAME_INTERVAL ||
          newSimTime === endTime
        ) {
          onUpdate(newSimTime);
          lastFrameRef.current = now;
        }

        simTimeRef.current = newSimTime;

        if (newSimTime < endTime) {
          animationRef.current = requestAnimationFrame(loop);
        } else {
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
