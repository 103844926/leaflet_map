import { React } from "react";
import "leaflet/dist/leaflet.css";
import { Box, Typography } from "@mui/material";
import { useCurrentShipPosition } from "@/hooks";

export function ShipInfoPanel({ ship, timeRange, onClose, controlRef }) {
  const current = useCurrentShipPosition(ship, timeRange);
  const { location: loc } = current;

  if (!current) return null;

  return (
    <Box
      ref={controlRef}
      sx={{
        position: "absolute",
        bottom: 20,
        right: 20,
        width: "auto",
        backgroundColor: "white",
        padding: "15px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        zIndex: 1000,
      }}
    >
      <Typography variant="body1" sx={{ marginBottom: 1 }}>
        Ship: {ship.ship_uid}
      </Typography>
      <Typography variant="body2" sx={{ marginBottom: 1 }}>
        Coordinates: {loc.lat.toFixed(4)}, {loc.long.toFixed(4)}
      </Typography>
      <Typography variant="body2" sx={{ marginBottom: 2, color: "#666" }}>
        Time Recorded:{" "}
        {loc.timeFormatted || new Date(loc.time).toLocaleString()}
      </Typography>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <button onClick={onClose}>Close</button>
      </Box>
    </Box>
  );
}
