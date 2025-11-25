import React, { useState, useEffect, useRef } from "react";
import { Box, IconButton, Collapse, Typography, Slider, Paper, Stack, Popover } from "@mui/material";
import { PlayArrow, Pause, CalendarMonth, Speed, RestartAlt } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { TimeWindowPicker } from "@/components";

export function ShipTimeControl({
  selectedTime,
  minTime,
  maxTime,
  onTimeChange,
  isAnimating,
  playbackSpeed,
  onAnimate,
  onPlaybackSpeedChange,
}) {
  const [windowStart, setWindowStart] = useState(minTime);
  const [windowEnd, setWindowEnd] = useState(maxTime);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [showPlaybackPicker, setPlaybackPicker] = useState(false);

  // Staging state for the date pickers
  const [stagingStart, setStagingStart] = useState(minTime);
  const [stagingEnd, setStagingEnd] = useState(maxTime);

  const playbackRef = useRef(null);
  const onTimeChangeRef = useRef(onTimeChange);
  const selectedTimeRef = useRef(selectedTime);
  const atEnd = selectedTime >= windowEnd - 1;

  useEffect(() => {
    onTimeChangeRef.current = onTimeChange;
    selectedTimeRef.current = selectedTime;
  });

  useEffect(() => {
    setWindowStart(minTime);
    setWindowEnd(maxTime);
  }, [minTime, maxTime]);

  // Snap selectedTime to window bounds only when window changes
  // Only snap if window bounds are valid
  useEffect(() => {
    if (windowStart == null) setWindowStart(minTime);
    if (windowEnd == null) setWindowEnd(maxTime);
    // Also update staging when props change
    if (stagingStart == null) setStagingStart(minTime);
    if (stagingEnd == null) setStagingEnd(maxTime);
  }, [minTime, maxTime, windowStart, windowEnd, stagingStart, stagingEnd]);

  // Close range picker during animation
  useEffect(() => {
    if (isAnimating) setShowRangePicker(false);
  }, [isAnimating]);

  const formatDateTime = (ts) =>
    ts
      ? new Date(ts).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      : "No data";

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          px: 2,
          py: 1.5,
          minWidth: 600,
          maxWidth: 768,
          zIndex: 1000,
          borderRadius: 4,
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
            setWindowStart={setWindowStart}
            setWindowEnd={setWindowEnd}
            selectedTime={selectedTime}
            onTimeChange={onTimeChange}
            onClose={() => setShowRangePicker(false)}
          />
        </Collapse>

        <Stack direction="row" spacing={2} mb={1} width="100%" alignItems="flex-start">
          <IconButton
            size="small"
            onClick={() =>
              onAnimate(selectedTime, windowStart, windowEnd, onTimeChange)
            }
            sx={{
              color: "white",
              backgroundColor: "black",
              "&:hover": { backgroundColor: "grey.800" },
            }}
          >
            {isAnimating
              ? <Pause />
              : atEnd
                ? <RestartAlt />
                : <PlayArrow />
            }
          </IconButton>

          <IconButton
            size="small"
            color="inherit"
            onClick={() => setPlaybackPicker((p) => !p)}
            ref={playbackRef}
          >
            <Speed />
          </IconButton>

          <Box sx={{ flex: 1, mx: 1 }}>
            <Slider
              value={selectedTime || windowEnd}
              min={windowStart}
              max={windowEnd}
              onChange={(_, v) => !isAnimating && onTimeChange(v)}
              step={(windowEnd - windowStart) / 1000}
              valueLabelDisplay="auto"
              valueLabelFormat={formatDateTime}
            />
            <Typography variant="body2" fontWeight="600" sx={{ fontSize: "0.8rem" }}>
              {formatDateTime(selectedTime)}
            </Typography>
          </Box>

          <IconButton
            size="small"
            color="inherit"
            onClick={() => setShowRangePicker(!showRangePicker)}
            disabled={isAnimating}
          >
            <CalendarMonth />
          </IconButton>
        </Stack>
      </Paper>

      <Popover
        open={showPlaybackPicker}
        anchorEl={playbackRef.current}
        onClose={() => setPlaybackPicker(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Box sx={{ py: 2.5, px: 1 }}>
          <Slider
            orientation="vertical"
            value={playbackSpeed}
            min={0.2}
            max={4}
            step={0.2}
            onChange={(_, v) => onPlaybackSpeedChange(v)}
            sx={{ height: 120, "& .MuiSlider-thumb": { width: 16, height: 16 } }}
          />
        </Box>
      </Popover>
    </LocalizationProvider>
  );
}