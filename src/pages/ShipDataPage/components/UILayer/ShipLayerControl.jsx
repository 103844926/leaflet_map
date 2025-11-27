import { React, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Paper, Typography, FormControlLabel, Checkbox, Stack, IconButton, Divider, Collapse } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";

export function ShipLayerControl({
  ships,
  visibleShips,
  onShipToggle,
  showPaths,
  onPathToggle,
  isAnimatingAll,
  controlRef,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Paper
      ref={controlRef}
      sx={{
        position: "fixed",
        bottom: 32,
        left: 32,
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
          Ships Control
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
          <FormControlLabel
            control={
              <Checkbox
                checked={showPaths}
                onChange={(e) => onPathToggle(e.target.checked)}
              />
            }
            label={
              <Typography sx={{ fontSize: "14px" }}>
                Show All Paths
              </Typography>
            }
          />

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" gutterBottom>
            Ships
          </Typography>

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
      </Collapse>
    </Paper>
  );
}
