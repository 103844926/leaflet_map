import { React, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
  Stack,
  IconButton,
  Collapse,
  Button,
  Box,
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";

export function ShipLayerControl({
  ships,
  visibleShips,
  onShipToggle,
  onAnimateAll,
  isAnimatingAll,
  controlRef,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Paper
      ref={controlRef}
      sx={{
        position: "absolute",
        bottom: 20,
        left: 20,
        width: "auto",
        maxHeight: "80vh",
        overflowY: "auto",
        backgroundColor: "white",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        zIndex: 1000,
      }}
    >
      {/* Header with Collapse Button */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ marginBottom: isExpanded ? 2 : 0 }}
      >
        <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: "bold" }}>
          Ships
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ marginLeft: 2 }}
        >
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Stack>

      {/* Collapsible Ship List */}
      <Collapse in={isExpanded}>
        <Stack sx={{ display: "flex", flexDirection: "column" }}>
          {ships.map((ship, index) => (
            <FormControlLabel
              key={ship.ship_uid}
              control={
                <Checkbox
                  checked={visibleShips[index] || false}
                  onChange={() => onShipToggle(index)}
                />
              }
              disabled={isAnimatingAll}
              label={
                <Stack
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <Typography sx={{ fontSize: "12px" }}>
                    {ship.ship_uid}
                  </Typography>
                </Stack>
              }
              sx={{ width: "auto", margin: "4px 0" }}
            />
          ))}
        </Stack>

        {/* Animate All Button */}
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
          <Button
            variant="contained"
            fullWidth
            onClick={onAnimateAll}
            sx={{
              textTransform: "none",
              backgroundColor: isAnimatingAll ? "#dc2c29ff" : "#1976d2",
              "&:hover": {
                backgroundColor: isAnimatingAll ? "#931d1bff" : "#1565c0",
              },
            }}
          >
            {isAnimatingAll ? "Stop All" : "Run All From Start"}
          </Button>
        </Box>
      </Collapse>
    </Paper>
  );
}
