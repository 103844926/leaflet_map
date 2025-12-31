// ============================================================================
// useRecording.js (Simplified - UI logic only)
// Handles recording state and timing
// ============================================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { useRecordingCapture } from "./useRecordingCapture";
import { useRecordingExport } from "./useRecordingExport";

export function useRecording({
    mapRef,
    isAnimating,
    onStartAnimation,
    shouldStop,
    recordingStartTime,
    recordingEndTime,
    onTimeChange,
    onRecordingStateChange,
    selectedTime,
    onResetTimeWindow,
}) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSpeed, setRecordingSpeed] = useState(0.5);
    const [hasStartedCapture, setHasStartedCapture] = useState(false);

    const DEFAULT_SPEED = 0.5;

    const shouldRecordRef = useRef(false);
    const hasStoppedRef = useRef(false);
    const animationCompleteTimeoutRef = useRef(null);
    const selectedTimeRef = useRef(selectedTime);

    const { startRecording: startCapture, stopRecording: stopCapture } = useRecordingCapture();
    const { exportRecording, isExporting, exportError } = useRecordingExport();


    useEffect(() => { selectedTimeRef.current = selectedTime }, [selectedTime]);

    // -------------------------------------------------------------------------
    // STOP RECORDING
    // -------------------------------------------------------------------------
    const stopRecording = useCallback(async () => {
        if (!isRecording || hasStoppedRef.current) return;

        console.log("🛑 Stopping recording...");
        hasStoppedRef.current = true;
        shouldRecordRef.current = false;
        setHasStartedCapture(false);
        setIsRecording(false);

        if (animationCompleteTimeoutRef.current) {
            clearTimeout(animationCompleteTimeoutRef.current);
            animationCompleteTimeoutRef.current = null;
        }

        const finalBlob = await stopCapture();

        if (!finalBlob) {
            alert("Recording failed or stopped too early.");
            return;
        }

        exportRecording(finalBlob);

        // Reset time window after recording completes
        if (onResetTimeWindow) {
            onResetTimeWindow();
        }

        console.log("✅ Recording complete!");
    }, [isRecording, stopCapture, exportRecording, onResetTimeWindow]);

    // -------------------------------------------------------------------------
    // START RECORDING
    // -------------------------------------------------------------------------
    const startRecording = useCallback(async () => {
        const startTime = recordingStartTime;
        const endTime = recordingEndTime;
        const duration = endTime - startTime;

        if (duration <= 0) {
            alert("Invalid time range!");
            return;
        }

        const mapInstance = mapRef?.current;
        if (!mapInstance) {
            alert("Map instance not found");
            return;
        }

        shouldRecordRef.current = true;
        hasStoppedRef.current = false;
        setIsRecording(true);

        // STEP 1: Position ships at start
        console.log("📍 Setting ships to start position...");
        onTimeChange(startTime);

        const initialDelay = Math.max(1500, 1000 * recordingSpeed);
        await new Promise((resolve) => setTimeout(resolve, initialDelay));

        // STEP 2: Start capture - NOW using ref instead of closure
        console.log("🎥 Starting recorder...");

        const stream = await startCapture(mapInstance, {
            fps: 24,
            scale: 1,
            videoBitsPerSecond: 15000000,
            adaptive: true,
            getCurrentTime: () => {
                // ← CHANGED: Use .current from ref to get latest value
                const currentTime = selectedTimeRef.current;
                return currentTime;
            }
        });

        if (!stream) {
            alert("Failed to start recording stream");
            setIsRecording(false);
            return;
        }

        const firstFrameDelay = Math.max(500, 300 * recordingSpeed);
        await new Promise((resolve) => setTimeout(resolve, firstFrameDelay));

        // STEP 4: Start animation
        console.log("▶️ Starting animation...");
        if (onStartAnimation) {
            onStartAnimation(startTime, endTime);
        }

        setHasStartedCapture(true);
        console.log("🔴 Recording active");
    }, [recordingStartTime, recordingEndTime, recordingSpeed, onTimeChange, mapRef, onStartAnimation, startCapture]);

    // -------------------------------------------------------------------------
    // RESET SPEED
    // -------------------------------------------------------------------------
    const resetRecordingSpeed = useCallback(() => {
        setRecordingSpeed(DEFAULT_SPEED);
    }, []);

    // -------------------------------------------------------------------------
    // Auto-stop when animation ends
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (hasStartedCapture && !isAnimating && isRecording && !hasStoppedRef.current) {
            console.log("⏹ Animation finished → waiting before stopping");
            animationCompleteTimeoutRef.current = setTimeout(() => {
                stopRecording();
            }, 1000);
        }

        return () => {
            if (animationCompleteTimeoutRef.current) {
                clearTimeout(animationCompleteTimeoutRef.current);
            }
        };
    }, [hasStartedCapture, isAnimating, isRecording, stopRecording]);

    // -------------------------------------------------------------------------
    // Notify state changes
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (onRecordingStateChange) {
            onRecordingStateChange(isRecording);
        }
    }, [isRecording, onRecordingStateChange]);

    // -------------------------------------------------------------------------
    // External stop
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (shouldStop && isRecording && !hasStoppedRef.current) {
            stopRecording();
        }
    }, [shouldStop, isRecording, stopRecording]);

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------
    useEffect(() => {
        return () => {
            if (animationCompleteTimeoutRef.current) {
                clearTimeout(animationCompleteTimeoutRef.current);
            }
        };
    }, []);

    // -------------------------------------------------------------------------
    return {
        isRecording,
        isProcessing: isExporting,
        recordingSpeed,
        setRecordingSpeed,
        startRecording,
        stopRecording,
        resetRecordingSpeed,
        mergeProgress: 0,
        exportError
    };
}