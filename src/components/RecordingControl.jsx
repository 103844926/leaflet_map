import React, { useCallback } from "react";
import { Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Slider, Stack, Box, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers";
import { useRecording, useRecordingTimeWindow } from "@/hooks";

export function RecordingControl({
    shouldStop,
    isAnimating,
    onStartAnimation,
    mapRef,
    ships,
    selectedRecordingShip,
    onRecordingShipChange,
    minTime,
    maxTime,
    selectedTime,  // ← Receives this prop
    onTimeChange,
    windowStart,
    windowEnd,
    setWindowStart,
    setWindowEnd,
    onRecordingStateChange,
    showDialog,
    onDialogChange,
    initialStartTime,
    showBackgroundShips,
    onShowBackgroundShipsChange,
    trackShip,
    onTrackShipChange,
}) {
    // Time window management
    const {
        stagingStart,
        stagingEnd,
        setStagingStart,
        setStagingEnd,
        resetTimeWindow
    } = useRecordingTimeWindow({
        minTime,
        maxTime,
        initialStartTime,
        showDialog
    });

    // Recording logic - FIXED: Now passes selectedTime
    const {
        isRecording,
        isProcessing,
        recordingSpeed,
        setRecordingSpeed,
        startRecording: startRecordingHook,
        stopRecording,
        resetRecordingSpeed
    } = useRecording({
        mapRef,
        isAnimating,
        onStartAnimation,
        shouldStop,
        recordingStartTime: stagingStart,
        recordingEndTime: stagingEnd,
        onTimeChange,
        onRecordingStateChange,
        selectedTime  // ← CRITICAL FIX: Pass selectedTime to useRecording
    });

    // Reset all settings to defaults
    const resetToDefaults = useCallback(() => {
        resetRecordingSpeed();
        resetTimeWindow();
    }, [resetRecordingSpeed, resetTimeWindow]);

    // Handle dialog close
    const handleCloseDialog = useCallback(() => {
        resetToDefaults();
        onDialogChange(false);
    }, [resetToDefaults, onDialogChange]);

    // Start recording with window updates
    const handleStartRecording = useCallback(() => {
        // DEBUG: Log the recording time range
        console.log("🔍 Recording times:", {
            start: new Date(stagingStart).toLocaleString(),
            end: new Date(stagingEnd).toLocaleString(),
            duration: ((stagingEnd - stagingStart) / 1000 / 60).toFixed(1) + " minutes",
            startTimestamp: stagingStart,
            endTimestamp: stagingEnd,
            isValid: stagingEnd > stagingStart
        });

        onDialogChange(false);
        setWindowStart(stagingStart);
        setWindowEnd(stagingEnd);
        startRecordingHook();
    }, [onDialogChange, setWindowStart, setWindowEnd, stagingStart, stagingEnd, startRecordingHook]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={showDialog} onClose={handleCloseDialog}>
                <DialogTitle>Start Recording?</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <Typography variant="body2">
                            Your map animation will be recorded into a .webm video.
                        </Typography>

                        {/* SHIPS DROPDOWN */}
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Ship</InputLabel>
                            {ships.length > 0 ? (
                                <Select
                                    label="Select Ship"
                                    value={selectedRecordingShip ?? 0}
                                    onChange={(e) => onRecordingShipChange(e.target.value)}
                                >
                                    {ships.map((ship, index) => (
                                        <MenuItem key={ship.ship_uid} value={index}>
                                            {ship.ship_uid}
                                        </MenuItem>
                                    ))}
                                </Select>
                            ) : (
                                <Select label="Select Ship" value="" disabled>
                                    <MenuItem value="">No ship found</MenuItem>
                                </Select>
                            )}
                        </FormControl>

                        {/* SHOW BACKGROUND SHIPS CHECKBOX */}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showBackgroundShips}
                                    onChange={(e) => onShowBackgroundShipsChange(e.target.checked)}
                                />
                            }
                            label="Show other ships (may reduce performance)"
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={trackShip}
                                    onChange={(e) => onTrackShipChange(e.target.checked)}
                                />
                            }
                            label="Track this ship during recording"
                        />

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
                                key={stagingStart}
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
                    <Button onClick={resetToDefaults}>
                        Reset
                    </Button>
                    <Button variant="outlined" onClick={handleCloseDialog}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleStartRecording}
                    >
                        Start Recording
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}