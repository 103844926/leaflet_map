import React, { useState, useRef, useEffect, useCallback } from "react";
import { Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Slider, Stack, Box } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers";
import html2canvas from "html2canvas";

export function RecordingControl({
    shouldStop,
    isAnimating,
    onStartAnimation,
    mapRef,
    minTime,
    maxTime,
    selectedTime,
    onTimeChange,
    windowStart,
    windowEnd,
    setWindowStart,
    setWindowEnd,
    onRecordingStateChange,
    showDialog,
    onDialogChange
}) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Recording speed multiplier 
    const [recordingSpeed, setRecordingSpeed] = useState(0.5);
    const DEFAULT_SPEED = 0.5;
    const RECORDING_BASE_SPEED = 120;

    // --- Time window state ---
    const [stagingStart, setStagingStart] = useState(minTime);
    const [stagingEnd, setStagingEnd] = useState(maxTime);

    const recordedFramesRef = useRef([]);
    const animationFrameRef = useRef(null);
    const shouldRecordRef = useRef(false);
    const recordingTimeRef = useRef(0);

    // ADD THIS: Reset function
    const resetToDefaults = useCallback(() => {
        setRecordingSpeed(DEFAULT_SPEED);
        setStagingStart(minTime);
        setStagingEnd(maxTime);
    }, [minTime, maxTime, DEFAULT_SPEED]);

    // ADD THIS: Reset when dialog closes
    const handleCloseDialog = useCallback(() => {
        resetToDefaults();
        onDialogChange(false);
    }, [resetToDefaults, onDialogChange]);

    // Sync staging with min/max changes
    useEffect(() => {
        setStagingStart(minTime);
        setStagingEnd(maxTime);
    }, [minTime, maxTime]);

    const captureFrame = async (mapContainer) => {
        try {
            const canvas = await html2canvas(mapContainer, {
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: mapContainer.offsetWidth,
                height: mapContainer.offsetHeight
            });
            return canvas.toDataURL("image/png");
        } catch (err) {
            console.error("Frame capture failed:", err);
            return null;
        }
    };

    // Also add this to stopRecording function to notify parent:
    const stopRecording = useCallback(async () => {
        if (!isRecording) return; // Guard clause to prevent duplicate calls

        shouldRecordRef.current = false;
        clearTimeout(animationFrameRef.current);
        setIsRecording(false);

        // STOP THE ANIMATION - calling animate again while animating stops it
        if (isAnimating && onStartAnimation) {
            onStartAnimation(stagingStart, stagingEnd);
        }

        const frames = recordedFramesRef.current;
        if (!frames.length) {
            alert("No frames captured");
            return;
        }

        setIsProcessing(true);

        try {
            const canvas = document.createElement("canvas");
            const img = new Image();
            img.src = frames[0];
            await new Promise((res) => (img.onload = res));
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");

            const stream = canvas.captureStream(20);
            const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
            const chunks = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: "video/webm" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `ship-recording-${Date.now()}.webm`;
                a.click();
                setIsProcessing(false);
            };

            recorder.start();
            for (let url of frames) {
                const img = new Image();
                img.src = url;
                await new Promise((res) => (img.onload = res));
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                await new Promise((res) => setTimeout(res, (1000 / 30) / recordingSpeed));
            }
            recorder.stop();
        } catch (err) {
            console.error("Recording processing failed:", err);
            alert("Failed to process recording");
            setIsProcessing(false);
        }
    }, [isAnimating, onStartAnimation, stagingStart, stagingEnd, recordingSpeed, isRecording]);

    // Effects that depend on stopRecording - placed AFTER stopRecording definition
    useEffect(() => {
        if (!isAnimating && isRecording) {
            stopRecording();
        }
    }, [isAnimating, isRecording, stopRecording]);

    useEffect(() => {
        if (onRecordingStateChange) {
            onRecordingStateChange(isRecording || isProcessing);
        }
    }, [isRecording, isProcessing, onRecordingStateChange]);

    useEffect(() => {
        if (shouldStop && isRecording) {  // Add isRecording check
            stopRecording();
        }
    }, [shouldStop, isRecording, stopRecording]);

    const startRecording = async () => {
        onDialogChange(false);

        setWindowStart(stagingStart);
        setWindowEnd(stagingEnd);

        const startTime = stagingStart;
        const endTime = stagingEnd;
        const duration = endTime - startTime;

        onTimeChange(startTime);

        const mapContainer = mapRef?.current?._container || document.querySelector(".leaflet-container");
        if (!mapContainer) {
            alert("Map container not found");
            return;
        }

        recordedFramesRef.current = [];
        shouldRecordRef.current = true;
        recordingTimeRef.current = 0;
        setIsRecording(true);

        if (!isAnimating && onStartAnimation) {
            onStartAnimation(stagingStart, stagingEnd);
        }

        const frameInterval = 1000 / 20; // 20 fps capture rate
        const timeIncrement = frameInterval * RECORDING_BASE_SPEED * recordingSpeed; // Use recording-specific speed

        const captureLoop = async () => {
            if (!shouldRecordRef.current) return;

            if (recordingTimeRef.current > duration) {
                stopRecording();
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
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <>
                <Dialog open={showDialog} onClose={handleCloseDialog}>
                    <DialogTitle>Start Recording?</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2}>
                            <Typography variant="body2">
                                Your map animation will be recorded into a .webm video.
                            </Typography>

                            <Box>
                                <Typography variant="caption">Recording Speed: {recordingSpeed}x</Typography>
                                <Slider
                                    value={recordingSpeed}
                                    min={0.1}
                                    max={2}
                                    step={0.1}
                                    onChange={(_, v) => setRecordingSpeed(v)}
                                />
                            </Box>

                            <Stack direction="row" spacing={2}>
                                <DateTimePicker
                                    label="Start Time"
                                    value={new Date(stagingStart)}
                                    onChange={(v) => setStagingStart(v?.getTime() || minTime)}
                                    minDateTime={new Date(minTime)}
                                    maxDateTime={new Date(stagingEnd)}
                                    ampm={false}
                                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                                />
                                <DateTimePicker
                                    label="End Time"
                                    value={new Date(stagingEnd)}
                                    onChange={(v) => setStagingEnd(v?.getTime() || maxTime)}
                                    minDateTime={new Date(stagingStart)}
                                    maxDateTime={new Date(maxTime)}
                                    ampm={false}
                                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                                />
                            </Stack>
                        </Stack>
                    </DialogContent>

                    <DialogActions>
                        <Button
                            onClick={resetToDefaults}
                        >
                            Reset
                        </Button>
                        <Button variant="outlined" onClick={handleCloseDialog}>
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={startRecording}
                        >
                            Start Recording
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        </LocalizationProvider>
    );
}