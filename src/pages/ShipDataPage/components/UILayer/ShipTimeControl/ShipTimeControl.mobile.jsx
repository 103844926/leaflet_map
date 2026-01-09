// ShipTimeControl/ShipTimeControl.mobile.jsx
import { Paper, Stack, IconButton, Slider, Popover, Box, Collapse, Typography, } from "@mui/material";
import { PlayArrow, Pause, RestartAlt, FiberManualRecord, Stop, Speed, CalendarMonth, } from "@mui/icons-material";
import { TimeWindowPicker } from "./TimeWindowPicker";

export function ShipTimeControlMobile({
    selectedTime,
    windowStart,
    setWindowStart,
    windowEnd,
    setWindowEnd,
    onTimeChange,
    isAnimating,
    onAnimate,
    playbackSpeed,
    onPlaybackSpeedChange,
    isRecordingActive,
    onRecordingButtonClick,
    movementMarks = [],

    showRangePicker,
    setShowRangePicker,

    showPlaybackPicker,
    setPlaybackPicker,
    playbackRef,

    stagingStart,
    stagingEnd,
    setStagingStart,
    setStagingEnd,

    minTime,
    maxTime,
}) {
    const atEnd = selectedTime >= windowEnd - 1;

    const formatDateTime = (ts) =>
        new Date(ts).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });

    return (
        <Paper
            sx={{
                position: "fixed",
                bottom: 12,
                left: "50%",
                transform: "translateX(-50%)",
                width: "90%",
                px: 1,
                py: 1,
                borderRadius: 2,
                zIndex: 1000,
                padding: "10px",
            }}
        >
            {/* RANGE PICKER */}
            <Collapse in={showRangePicker}>
                <TimeWindowPicker
                    minTime={minTime}
                    maxTime={maxTime}

                    stagingStart={stagingStart}
                    stagingEnd={stagingEnd}
                    setStagingStart={setStagingStart}
                    setStagingEnd={setStagingEnd}

                    windowStart={windowStart}
                    windowEnd={windowEnd}
                    setWindowStart={setWindowStart}
                    setWindowEnd={setWindowEnd}

                    selectedTime={selectedTime}
                    onTimeChange={onTimeChange}
                    onClose={() => setShowRangePicker(false)}
                />
            </Collapse>

            <Stack>
                {/* BUTTON ROW */}
                <Stack direction="row" spacing={2} justifyContent="flex-start">
                    {!isRecordingActive && (
                        <IconButton
                            size="small"
                            onClick={() =>
                                onAnimate(selectedTime, windowStart, windowEnd, onTimeChange)
                            }
                        >
                            {isAnimating ? (
                                <Pause />
                            ) : atEnd ? (
                                <RestartAlt />
                            ) : (
                                <PlayArrow />
                            )}
                        </IconButton>
                    )}

                    <IconButton
                        size="small"
                        color={isRecordingActive ? "error" : "success"}
                        onClick={onRecordingButtonClick}
                    >
                        {isRecordingActive ? <Stop /> : <FiberManualRecord />}
                    </IconButton>

                    {(isRecordingActive) && (
                        <Typography sx={{ ml: 2, fontWeight: "bold", color: "error" }}>
                            RECORDING
                        </Typography>
                    )}

                    {!isRecordingActive && (
                        <IconButton
                            size="small"
                            onClick={() => setPlaybackPicker((v) => !v)}
                            ref={playbackRef}
                        >
                            <Speed />
                        </IconButton>
                    )}

                    {!isRecordingActive && (
                        <IconButton
                            size="small"
                            onClick={() => setShowRangePicker((v) => !v)}
                        >
                            <CalendarMonth />
                        </IconButton>
                    )}
                </Stack>

                {/*TIME SLIDER */}
                <Slider
                    size="small"
                    value={selectedTime ?? windowEnd ?? 0}
                    min={windowStart}
                    max={windowEnd}
                    onChange={(_, v) => !isAnimating && onTimeChange(v)}
                    disabled={isAnimating}
                    step={(windowEnd - windowStart) / 1000}
                    valueLabelDisplay="auto"
                    valueLabelFormat={formatDateTime}
                    marks={movementMarks.map((m) => ({
                        value: m.time,
                    }))}
                />

                <Typography variant="caption">
                    {formatDateTime(selectedTime)}
                </Typography>
            </Stack>

            {/* PLAYBACK SPEED SLIDER */}
            <Popover
                open={showPlaybackPicker}
                anchorEl={playbackRef.current}
                onClose={() => setPlaybackPicker(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                transformOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Box sx={{ p: 0.5 }}>
                    <Slider
                        orientation="vertical"
                        value={playbackSpeed}
                        min={0.2}
                        max={4}
                        step={0.2}
                        onChange={(_, v) => onPlaybackSpeedChange(v)}
                        sx={{ height: 120 }}
                    />
                </Box>
            </Popover>
        </Paper>
    );
}
