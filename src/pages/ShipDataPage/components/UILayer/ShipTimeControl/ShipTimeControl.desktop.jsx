// ShipTimeControl/ShipTimeControl.desktop.jsx
import { Paper, Stack, IconButton, Slider, Typography, Popover, Box, Tooltip, Collapse, } from "@mui/material";
import { PlayArrow, Pause, RestartAlt, FiberManualRecord, Stop, Speed, CalendarMonth, DirectionsBoat, } from "@mui/icons-material";
import { TimeWindowPicker } from "@/components";

export function ShipTimeControlDesktop({
    selectedTime,
    windowStart,
    windowEnd,
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
                    onClose={() => setShowRangePicker(false)}
                />
            </Collapse>

            <Stack direction="row" spacing={2} mb={1} alignItems="flex-start">
                <Stack
                    direction="row"
                    spacing={1}
                    justifyContent={"flex-start"}
                >
                    {!isRecordingActive && (
                        <IconButton
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
                        color={isRecordingActive ? "error" : "success"}
                        onClick={onRecordingButtonClick}
                    >
                        {isRecordingActive ? <Stop /> : <FiberManualRecord />}
                    </IconButton>

                    {!isRecordingActive && (
                        <IconButton
                            onClick={() => setPlaybackPicker((v) => !v)}
                            ref={playbackRef}
                        >
                            <Speed />
                        </IconButton>
                    )}
                </Stack>

                <Box sx={{ flex: 1 }}>
                    <Slider
                        value={selectedTime || windowEnd}
                        min={windowStart}
                        max={windowEnd}
                        onChange={(_, v) => !isAnimating && onTimeChange(v)}
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
                        onClick={() => setShowRangePicker((v) => !v)}
                        disabled={isAnimating}
                    >
                        <CalendarMonth />
                    </IconButton>
                )}
            </Stack>

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
