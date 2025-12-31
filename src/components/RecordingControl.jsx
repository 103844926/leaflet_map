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
    visibleShips,
    selectedRecordingShip,
    onRecordingShipChange,
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
    onDialogChange,
    initialStartTime,
    trackShip,
    onTrackShipChange,
    movementMarks,
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

    // Recording logic
    const {
        recordingSpeed,
        setRecordingSpeed,
        startRecording: startRecordingHook,
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
        selectedTime,
        onResetTimeWindow: () => {
            setWindowStart(minTime);
            setWindowEnd(maxTime);
        }
    });

    const ALL_SHIPS = -1;

    // When ship selection changes, update start time automatically
    const handleShipChange = useCallback((shipIndex) => {
        onRecordingShipChange(shipIndex === ALL_SHIPS ? null : shipIndex);

        // Only auto-set start time if a specific ship is selected (not null)
        if (shipIndex !== null) {
            // Get the ship_uid for this index
            const selectedShip = ships[shipIndex];
            if (selectedShip) {
                const startTime = movementMarks.get(selectedShip.ship_uid)?.time;
                if (startTime) {
                    console.log(`🚢 Ship ${selectedShip.ship_uid} start time:`, new Date(startTime).toLocaleString());
                    // Update the staging start time directly
                    setStagingStart(startTime);
                }
            }
        }
    }, [ALL_SHIPS, onRecordingShipChange, ships, movementMarks, setStagingStart]);

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
        console.log("📹 Recording times:", {
            start: new Date(stagingStart).toLocaleString(),
            end: new Date(stagingEnd).toLocaleString(),
            duration: ((stagingEnd - stagingStart) / 1000 / 60).toFixed(1) + " minutes",
            startTimestamp: stagingStart,
            endTimestamp: stagingEnd,
            isValid: stagingEnd > stagingStart,
            focusShip: ships[selectedRecordingShip]?.ship_uid
        });

        onDialogChange(false);
        setWindowStart(stagingStart);
        setWindowEnd(stagingEnd);
        startRecordingHook();
    }, [onDialogChange, setWindowStart, setWindowEnd, stagingStart, stagingEnd, startRecordingHook, selectedRecordingShip, ships]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={showDialog} onClose={handleCloseDialog}>
                <DialogTitle>Start Recording?</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <Typography variant="body2">
                            Your map animation will be recorded into a video. All visible ships on screen will be recorded.
                        </Typography>

                        {/* SHIPS DROPDOWN - For focus/tracking only */}
                        <FormControl fullWidth size="small">
                            <InputLabel>Choose Ship</InputLabel>
                            {ships.length > 0 ? (
                                <Select
                                    label="Choose Ship"
                                    value={selectedRecordingShip ?? ALL_SHIPS}
                                    onChange={(e) => handleShipChange(e.target.value)}
                                >
                                    <MenuItem value={ALL_SHIPS}>
                                        <strong>All Ships</strong>
                                    </MenuItem>

                                    {ships.map((ship, index) => (
                                        <MenuItem
                                            key={ship.ship_uid}
                                            value={index}
                                            disabled={!visibleShips[index]}
                                        >
                                            {ship.ship_uid} {!visibleShips[index] && "(hidden)"}
                                        </MenuItem>
                                    ))}
                                </Select>

                            ) : (
                                <Select label="Choose Ship" value="" disabled>
                                    <MenuItem value="">No ship found</MenuItem>
                                </Select>
                            )}
                        </FormControl>

                        {/* TRACK SHIP CHECKBOX - Only when specific ship selected */}
                        {selectedRecordingShip !== null && (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={trackShip}
                                        onChange={(e) => onTrackShipChange(e.target.checked)}
                                    />
                                }
                                label="Track the focus ship during recording"
                            />
                        )}

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