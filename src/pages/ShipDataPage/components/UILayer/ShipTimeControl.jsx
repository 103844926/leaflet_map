import React, { useState } from "react";
import {
  Stack,
  Button,
  IconButton,
  Box,
  Paper,
  Typography,
  Popover,
  TextField,
  Collapse,
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import {
  LocalizationProvider,
  DatePicker,
  MultiSectionDigitalClock,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useShipTime } from "@/hooks";

export function ShipTimeControl({
  ships,
  onTimeChange,
  controlRef,
  isAnimating = false,
  currentSimulatedTime = null,
  availableTimes: externalAvailableTimes = null,
  animateAll,
  isAnimatingAll,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const { availableTimes, selectedTime, minTime, maxTime, updateTime } =
    useShipTime(
      ships,
      externalAvailableTimes,
      isAnimating,
      currentSimulatedTime,
      onTimeChange,
    );

  if (!availableTimes.length) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper
        ref={controlRef}
        sx={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          backgroundColor: "white",
          padding: 2,
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          pointerEvents: "auto",
          zIndex: 1000,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: isExpanded ? 2 : 0 }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Time Clock{" "}
            {isAnimating && (
              <span style={{ color: "#1976d2" }}>(Animating...)</span>
            )}
          </Typography>

          <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Stack>

        <Collapse in={isExpanded}>
          <Box sx={{ px: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ marginBottom: isExpanded ? 2 : 0 }}
            >
              {/* Time Picker */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ display: "block", mb: 0.5, color: "#666" }}
                >
                  Time
                </Typography>

                <TextField
                  value={
                    selectedTime
                      ? formatTime24(new Date(selectedTime)).split(" ")[1] // Gets only "HH:mm:ss" part
                      : "--:--:--"
                  }
                  onClick={(e) => !isAnimating && setAnchorEl(e.currentTarget)}
                  readOnly
                  disabled={isAnimating}
                  fullWidth
                  sx={{
                    cursor: isAnimating ? "default" : "pointer",
                    "& input": {
                      textAlign: "center",
                      fontSize: "1.5rem",
                      fontFamily: "monospace",
                    },
                  }}
                />

                {/* Popover with MultiSectionDigitalClock */}
                <Popover
                  open={open}
                  anchorEl={anchorEl}
                  onClose={() => {
                    // Force blur any focused element inside the popover
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                    setAnchorEl(null);
                  }}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "center",
                  }}
                >
                  <MultiSectionDigitalClock
                    value={selectedTime ? new Date(selectedTime) : null}
                    onChange={(newValue) => {
                      if (newValue) {
                        const current = new Date(selectedTime);
                        current.setHours(newValue.getHours());
                        current.setMinutes(newValue.getMinutes());
                        current.setSeconds(newValue.getSeconds());
                        updateTime(current.getTime());
                      }
                      // Optional: close after selection
                      // setAnchorEl(null);
                    }}
                    views={["hours", "minutes", "seconds"]}
                    timeSteps={{ hours: 1, minutes: 1, seconds: 1 }}
                    ampm={false}
                  />
                </Popover>
              </Box>

              {/* Date Picker */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ display: "block", mb: 0.5, color: "#666" }}
                >
                  Date
                </Typography>
                <DatePicker
                  value={selectedTime ? new Date(selectedTime) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      // Preserve the time, update only date
                      const current = new Date(selectedTime);
                      newValue.setHours(current.getHours());
                      newValue.setMinutes(current.getMinutes());
                      newValue.setSeconds(current.getSeconds());
                      updateTime(newValue.getTime());
                    }
                  }}
                  disabled={isAnimating}
                  minDate={new Date(minTime)}
                  maxDate={new Date(maxTime)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { fontSize: "0.9rem", "& input": { padding: 1 } },
                    },
                  }}
                />
              </Box>
            </Stack>

            {/* Show range info */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 1,
                fontSize: 12,
                color: "#666",
              }}
            >
              <span>Min: {formatTime24(minTime)}</span>
              <span>Max: {formatTime24(maxTime)}</span>
            </Box>

            <Button
              variant="contained"
              onClick={() => {
                if (!selectedTime || availableTimes.length === 0) return;

                // Clamp selectedTime within available range
                const clampedTime = Math.max(
                  minTime,
                  Math.min(maxTime, selectedTime),
                );

                // Use animateAll passed from parent
                animateAll(clampedTime);
              }}
              sx={{
                textTransform: "none",
                backgroundColor: isAnimatingAll ? "#dc2c29ff" : "#1976d2",
                "&:hover": {
                  backgroundColor: isAnimatingAll ? "#931d1bff" : "#1565c0",
                },
              }}
            >
              {isAnimatingAll ? "Stop All" : "Run All From Current"}
            </Button>
          </Box>
        </Collapse>
      </Paper>
    </LocalizationProvider>
  );
}

// 24-hour full datetime YYYY-MM-DD HH:mm:ss
function formatTime24(timestamp) {
  if (!timestamp) return "--";
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
