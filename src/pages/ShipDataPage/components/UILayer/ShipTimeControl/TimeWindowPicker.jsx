import React from "react";
import { Box, Button, Typography, Stack } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";

export function TimeWindowPicker({
    minTime,
    maxTime,
    stagingStart,
    stagingEnd,
    setStagingStart,
    setStagingEnd,
    setWindowStart,
    setWindowEnd,
    selectedTime,
    onTimeChange,
    onClose,
}) {
    // Apply staged time window
    const handleApply = () => {
        setWindowStart(stagingStart);
        setWindowEnd(stagingEnd);

        // Snap slider if value goes outside the window
        if (selectedTime > stagingEnd) {
            onTimeChange(stagingEnd);
        } else if (selectedTime < stagingStart) {
            onTimeChange(stagingStart);
        }
        console.log("Applied time window:", stagingStart, stagingEnd);
    };

    // Reset to default range
    const handleReset = () => {
        setWindowStart(minTime);
        setWindowEnd(maxTime);
        setStagingStart(minTime);
        setStagingEnd(maxTime);
    };

    // Time range validity check
    const isTimeRangeInvalid = stagingStart >= stagingEnd;

    return (
        <Box sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 1, border: "1px solid", borderColor: "grey.300" }}>
            <Typography variant="subtitle1" fontWeight="600" mb={2}>
                Select Time Window
            </Typography>

            <Stack direction="row" spacing={2} mb={2}>
                {/* Choose Staging Start Time */}
                <DateTimePicker
                    label="Start Time"
                    value={new Date(stagingStart)}
                    onChange={(v) => setStagingStart(v?.getTime() || minTime)}
                    minDateTime={new Date(minTime)}
                    maxDateTime={new Date(stagingEnd)}
                    ampm={false}
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />

                {/* Choose Staging End Time */}
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

            {isTimeRangeInvalid && (
                <Typography variant="body2" color="error">
                    ⚠️ Start time must be before end time
                </Typography>
            )}

            <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" onClick={handleApply} disabled={isTimeRangeInvalid}>Apply</Button>
                <Button variant="contained" color="inherit" size="small" onClick={handleReset}>Reset</Button>
                <Button variant="outlined" size="small" sx={{ ml: "auto" }} onClick={onClose}>Close</Button>
            </Stack>
        </Box>
    );
}
