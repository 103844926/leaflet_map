import { useState, useRef, useEffect, useCallback } from "react";
import { useRecordingFrameCapture } from "./useRecordingFrameCapture";
import { useRecordingVideoProcessor } from "./useRecordingVideoProcessor";

export function useRecording({
    mapRef,
    isAnimating,
    onStartAnimation,
    shouldStop,
    recordingStartTime,  // ← Changed from windowStart
    recordingEndTime,    // ← Changed from windowEnd
    onTimeChange,
    onRecordingStateChange
}) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSpeed, setRecordingSpeed] = useState(0.5);

    const DEFAULT_SPEED = 0.5;
    const RECORDING_BASE_SPEED = 120;
    const shouldRecordRef = useRef(false);

    // Use frame capture hook
    const {
        recordedFramesRef,
        animationFrameRef,
        recordingTimeRef,
        captureFrame,
        clearFrames
    } = useRecordingFrameCapture();

    // Use video processing hook
    const { isProcessing, processFramesToVideo } = useRecordingVideoProcessor();

    const stopRecording = useCallback(async () => {
        if (!isRecording) return;

        shouldRecordRef.current = false;
        clearTimeout(animationFrameRef.current);
        setIsRecording(false);

        // Stop the animation
        if (isAnimating && onStartAnimation) {
            onStartAnimation(recordingStartTime, recordingEndTime);
        }

        // Process frames into video
        await processFramesToVideo(recordedFramesRef.current, recordingSpeed);

        // Clear frames after processing
        clearFrames();
    }, [
        isRecording,
        isAnimating,
        onStartAnimation,
        recordingStartTime,
        recordingEndTime,
        recordingSpeed,
        clearFrames,
        processFramesToVideo,
        recordedFramesRef,
        animationFrameRef
    ]);

    const startRecording = useCallback(async () => {
        const startTime = recordingStartTime;
        const endTime = recordingEndTime;
        const duration = endTime - startTime;

        onTimeChange(startTime);

        const mapContainer = mapRef?.current?._container || document.querySelector(".leaflet-container");
        if (!mapContainer) {
            alert("Map container not found");
            return;
        }

        clearFrames();
        shouldRecordRef.current = true;
        setIsRecording(true);

        if (!isAnimating && onStartAnimation) {
            onStartAnimation(recordingStartTime, recordingEndTime);
        }

        const frameInterval = 1000 / 20; // 20 fps capture rate
        const timeIncrement = frameInterval * RECORDING_BASE_SPEED * recordingSpeed;

        const captureLoop = async () => {
            if (!shouldRecordRef.current) return;

            if (recordingTimeRef.current > duration) {
                // Call stopRecording instead of duplicating logic
                await stopRecording();
                return;
            }

            const frame = await captureFrame(mapContainer);
            if (frame) {
                recordedFramesRef.current.push(frame);
            }

            recordingTimeRef.current += timeIncrement;
            animationFrameRef.current = setTimeout(captureLoop, frameInterval);
        };

        captureLoop();
    }, [
        recordingStartTime,
        recordingEndTime,
        onTimeChange,
        mapRef,
        isAnimating,
        onStartAnimation,
        recordingSpeed,
        clearFrames,
        captureFrame,
        recordedFramesRef,
        recordingTimeRef,
        animationFrameRef,
        stopRecording
    ]);

    const resetRecordingSpeed = useCallback(() => {
        setRecordingSpeed(DEFAULT_SPEED);
    }, []);

    // Auto-stop when animation ends
    useEffect(() => {
        if (!isAnimating && isRecording) {
            stopRecording();
        }
    }, [isAnimating, isRecording, stopRecording]);

    // Notify parent of recording state
    useEffect(() => {
        if (onRecordingStateChange) {
            onRecordingStateChange(isRecording || isProcessing);
        }
    }, [isRecording, isProcessing, onRecordingStateChange]);

    // Handle external stop signal
    useEffect(() => {
        if (shouldStop && isRecording) {
            stopRecording();
        }
    }, [shouldStop, isRecording, stopRecording]);

    return {
        isRecording,
        isProcessing,
        recordingSpeed,
        setRecordingSpeed,
        startRecording,
        stopRecording,
        resetRecordingSpeed
    };
}