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
    const [hasStartedCapture, setHasStartedCapture] = useState(false);

    const shouldRecordRef = useRef(false);
    const hasStoppedRef = useRef(false);

    // Prevent double-stop race conditions
    const stoppingRef = useRef(false);

    const animationCompleteTimeoutRef = useRef(null);
    const selectedTimeRef = useRef(selectedTime);

    const {
        startRecording: startCapture,
        stopRecording: stopCapture,
    } = useRecordingCapture();

    const { exportRecording, isExporting, exportError } = useRecordingExport();

    useEffect(() => {
        selectedTimeRef.current = selectedTime;
    }, [selectedTime]);

    // -------------------------------------------------------------------------
    // STOP RECORDING
    // -------------------------------------------------------------------------
    const stopRecording = useCallback(async () => {
        if (!isRecording || hasStoppedRef.current || stoppingRef.current) return;

        console.log(" Stopping recording...");

        stoppingRef.current = true;
        hasStoppedRef.current = true;
        shouldRecordRef.current = false;

        setHasStartedCapture(false);
        setIsRecording(false);

        if (animationCompleteTimeoutRef.current) {
            clearTimeout(animationCompleteTimeoutRef.current);
            animationCompleteTimeoutRef.current = null;
        }

        // CLEANUP: stop capture & release all MediaRecorder resources
        const finalBlob = await stopCapture();

        stoppingRef.current = false;

        if (!finalBlob) {
            alert("Recording failed or stopped too early.");
            return;
        }

        exportRecording(finalBlob);

        // Reset time window after recording completes
        if (onResetTimeWindow) {
            onResetTimeWindow();
        }

        onRecordingStateChange?.(false);

        console.log(" Recording complete!");
    }, [isRecording, stopCapture, exportRecording, onResetTimeWindow, onRecordingStateChange]);

    // -------------------------------------------------------------------------
    // START RECORDING
    // -------------------------------------------------------------------------
    const startRecording = useCallback(async () => {
        const startTime = recordingStartTime;
        const endTime = recordingEndTime;

        const mapInstance = mapRef?.current;
        if (!mapInstance) {
            alert("Map instance not found");
            return;
        }

        shouldRecordRef.current = true;
        hasStoppedRef.current = false;
        stoppingRef.current = false;

        setIsRecording(true);

        // STEP 1: Position ships at start
        console.log(" Setting ships to start position...");
        onTimeChange(startTime);

        const initialDelay = 1500;
        await new Promise((resolve) => setTimeout(resolve, initialDelay));

        // STEP 2: Start capture
        console.log(" Starting recorder...");

        const stream = await startCapture(mapInstance, {
            fps: 24,
            scale: 1,
            videoBitsPerSecond: 15_000_000,
            adaptive: true,

            // Always read latest selected time via ref
            getCurrentTime: () => selectedTimeRef.current,
        });

        if (!stream) {
            alert("Failed to start recording stream");
            setIsRecording(false);
            return;
        }

        const firstFrameDelay = 500;
        await new Promise((resolve) => setTimeout(resolve, firstFrameDelay));

        // STEP 4: Start animation
        console.log(" Starting animation...");
        onStartAnimation?.(startTime, endTime);

        setHasStartedCapture(true);
        console.log(" Recording active");
    }, [
        recordingStartTime,
        recordingEndTime,
        onTimeChange,
        mapRef,
        onStartAnimation,
        startCapture,
    ]);

    // -------------------------------------------------------------------------
    // Auto-stop when animation ends
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (
            hasStartedCapture &&
            !isAnimating &&
            isRecording &&
            !hasStoppedRef.current
        ) {
            console.log(" Animation finished → waiting before stopping");

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
        onRecordingStateChange?.(isRecording);
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
    // Cleanup on unmount
    // -------------------------------------------------------------------------
    useEffect(() => {
        return () => {
            if (animationCompleteTimeoutRef.current) {
                clearTimeout(animationCompleteTimeoutRef.current);
            }
        };
    }, []);

    return {
        isRecording,
        isProcessing: isExporting,
        startRecording,
        stopRecording,
        mergeProgress: 0,
        exportError,
    };
}
