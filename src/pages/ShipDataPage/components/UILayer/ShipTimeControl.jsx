// ShipTimeControl.jsx (Clean + Simplified)
import React, { useState, useEffect, useRef } from "react";
import { Box, IconButton, Collapse, Typography, Slider, Paper, Stack, Popover, Tooltip } from "@mui/material";
import { PlayArrow, Pause, CalendarMonth, Speed, RestartAlt, FiberManualRecord, Stop } from "@mui/icons-material";
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
  mapRef,
  isRecordingActive,
  onRecordingButtonClick,
  movementMarks = [],  // ADD THIS PROP
}) {
  const [windowStart, setWindowStart] = useState(minTime);
  const [windowEnd, setWindowEnd] = useState(maxTime);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [showPlaybackPicker, setPlaybackPicker] = useState(false);

  // Staging for time window picker
  const [stagingStart, setStagingStart] = useState(minTime);
  const [stagingEnd, setStagingEnd] = useState(maxTime);

  const playbackRef = useRef(null);
  const atEnd = selectedTime >= windowEnd - 1;

  // --- Sync when min/max changes ---
  useEffect(() => {
    setWindowStart(minTime);
    setWindowEnd(maxTime);
    setStagingStart(minTime);
    setStagingEnd(maxTime);
  }, [minTime, maxTime]);

  // --- Close range picker when animating ---
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
        hour12: false
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
          borderRadius: 4
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
            setWindowStart={setWindowStart}
            setWindowEnd={setWindowEnd}
            selectedTime={selectedTime}
            onTimeChange={onTimeChange}
            onClose={() => setShowRangePicker(false)}
          />
        </Collapse>

        <Stack direction="row" spacing={2} mb={1} width="100%" alignItems="flex-start">
          {/* PLAY / PAUSE / RESTART */}
          {!isRecordingActive && (
            <IconButton
              size="small"
              onClick={() =>
                onAnimate(selectedTime, windowStart, windowEnd, onTimeChange)
              }
              sx={{
                color: "white",
                backgroundColor: "black",
                "&:hover": { backgroundColor: "grey.800" }
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

          {/* RECORDING BUTTON - stays here for easy access */}
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

          {/* PLAYBACK SPEED POPOVER BUTTON */}
          {!isRecordingActive && (
            <IconButton
              size="small"
              color="inherit"
              onClick={() => setPlaybackPicker((p) => !p)}
              ref={playbackRef}
            >
              <Speed />
            </IconButton>
          )}

          {/* SLIDER */}
          <Box sx={{ flex: 1, mx: 1 }}>
            <Slider
              value={selectedTime || windowEnd}
              min={windowStart}
              max={windowEnd}
              onChange={(_, v) => !isAnimating && onTimeChange(v)}
              step={(windowEnd - windowStart) / 1000}
              valueLabelDisplay="auto"
              valueLabelFormat={formatDateTime}
              disabled={isRecordingActive}
              marks={movementMarks
                .filter(mark => mark.time >= windowStart && mark.time <= windowEnd)
                .map(mark => ({
                  value: mark.time,
                  label: (
                    <Tooltip
                      title={
                        <div><strong>Ship:</strong> {mark.shipUid}</div>
                      }
                      arrow
                      placement="top"
                    >
                      <span style={{ cursor: 'pointer' }}>🚢</span>
                    </Tooltip>
                  )
                }))}
              sx={{
                '& .MuiSlider-mark': {
                  backgroundColor: '#4caf50',
                  width: 3,
                  height: 12,
                  borderRadius: 1,
                },
                '& .MuiSlider-markLabel': {
                  fontSize: '1.2rem',
                  top: -24,
                  cursor: 'pointer',
                }
              }}
            />

            <Typography
              variant="body2"
              fontWeight="600"
              sx={{ fontSize: "0.8rem" }}
            >
              {formatDateTime(selectedTime)}
            </Typography>
          </Box>


          {/* RANGE PICKER BUTTON */}
          {!isRecordingActive && (
            < IconButton
              size="small"
              color="inherit"
              onClick={() => setShowRangePicker((v) => !v)}
              disabled={isAnimating}
            >
              <CalendarMonth />
            </IconButton>
          )}

        </Stack>
      </Paper>

      {/* PLAYBACK SPEED POPOVER */}
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
            sx={{ height: 120 }}
          />
        </Box>
      </Popover>
    </LocalizationProvider >
  );
}
