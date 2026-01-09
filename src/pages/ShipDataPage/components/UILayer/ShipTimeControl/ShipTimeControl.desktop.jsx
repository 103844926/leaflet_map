// ShipTimeControl/ShipTimeControl.desktop.jsx
import { Paper, Stack, IconButton, Slider, Typography, Popover, Box, Tooltip, Collapse, } from "@mui/material";
import { PlayArrow, Pause, RestartAlt, FiberManualRecord, Stop, Speed, CalendarMonth, DirectionsBoat, } from "@mui/icons-material";
import { TimeWindowPicker } from "./TimeWindowPicker";

export function ShipTimeControlDesktop({
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
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                width: 600,
                px: 2,
                py: 1,
                borderRadius: 3,
                zIndex: 1000,
            }}
        >
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

            <Stack direction="row" spacing={2} mb={1} alignItems="flex-start">
                <Stack
                    direction="row"
                    spacing={1.5}
                    justifyContent={"flex-start"}
                >
                    {!isRecordingActive && (
                        <IconButton
                            size="small"
                            onClick={() =>
                                onAnimate(selectedTime, windowStart, windowEnd, onTimeChange)
                            }
                            sx={{
                                color: "white",
                                backgroundColor: "grey.800",
                                "&:hover": { backgroundColor: "grey.600" }
                            }}
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
                        onClick={onRecordingButtonClick}
                        sx={{
                            color: "white",
                            backgroundColor: isRecordingActive ? "error.main" : "success.main",
                            "&:hover": { backgroundColor: isRecordingActive ? "error.dark" : "success.dark" }
                        }}
                    >
                        {isRecordingActive ? <Stop /> : <FiberManualRecord />}
                    </IconButton>

                    {(isRecordingActive) && (
                        <Typography sx={{ ml: 2, fontWeight: "bold", color: "error.main" }}>
                            RECORDING
                        </Typography>
                    )}

                    {!isRecordingActive && (
                        <IconButton
                            size="small"
                            onClick={() => setPlaybackPicker((v) => !v)}
                            ref={playbackRef}
                            sx={{
                                color: "white",
                                backgroundColor: "grey.800",
                                "&:hover": { backgroundColor: "grey.600" }
                            }}
                        >
                            <Speed />
                        </IconButton>
                    )}
                </Stack>

                {/*TIME SLIDER */}
                <Box sx={{ flex: 1 }}>
                    <Slider
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
                            label: (
                                <Tooltip title={m.shipUid}>
                                    <DirectionsBoat fontSize="small" />
                                </Tooltip>
                            ),
                        }))}
                    />
                    <Typography variant="caption">
                        {formatDateTime(selectedTime)}
                    </Typography>
                </Box>

                {!isRecordingActive && (
                    <IconButton
                        size="small"
                        onClick={() => setShowRangePicker((v) => !v)}
                        disabled={isAnimating}
                        sx={{
                            color: "white",
                            backgroundColor: "grey.800",
                            "&:hover": { backgroundColor: "grey.600" }
                        }}
                    >
                        <CalendarMonth />
                    </IconButton>
                )}
            </Stack>

            {/* PLAYBACK SPEED SLIDER */}
            <Popover
                open={showPlaybackPicker}
                anchorEl={playbackRef.current}
                onClose={() => setPlaybackPicker(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                transformOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Box sx={{ p: 1 }}>
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
