import React from "react";
import { Box, Typography } from "@mui/material";

export function ShipInfoPanel({ ship, timeRange, onClose, controlRef }) {

  const resolveLocations = () => {
    // Historical ship
    if (Array.isArray(ship?.locations) && ship.locations.length > 0) {
      return ship.locations;
    }

    // Current-position ship
    if (ship?.isCurrentPosition && ship.lat != null && ship.long != null) {
      return [
        {
          lat: ship.lat,
          long: ship.long,
          time: ship.crawl_time ?? Date.now(),
          timeFormatted: ship.crawl_time
            ? new Date(ship.crawl_time).toLocaleString()
            : "Current position",
        },
      ];
    }

    return null;
  };

  const getCurrentPosition = () => {
    const locations = resolveLocations();
    if (!locations) return null;

    let currentIndex = locations.length - 1;

    if (timeRange && locations.length > 1) {
      const lastVisibleIndex = locations.findIndex(
        (loc) => loc.time > timeRange[1]
      );
      currentIndex =
        lastVisibleIndex === -1
          ? locations.length - 1
          : Math.max(0, lastVisibleIndex - 1);
    }

    return {
      index: currentIndex,
      location: locations[currentIndex],
    };
  };

  const current = getCurrentPosition();
  if (!current) return null;

  const { location: loc } = current;

  const lat = loc.lat ?? loc.latitude;
  const lng = loc.long ?? loc.lng ?? loc.longitude;
  const speed = loc?.speed ?? ship.speed;

  const shipId = ship.ship_uid ?? ship.mmsi ?? ship.id ?? "Unknown";
  const shipSpeed = speed != null ? `${speed} knots` : "Unknown";

  return (
    <Box
      ref={controlRef}
      sx={{
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "white",
        padding: "15px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        zIndex: 1000,
      }}
    >
      <Typography variant="body1" sx={{ mb: 1 }}>
        Ship: {shipId}
      </Typography>

      <Typography variant="body2" sx={{ mb: 1 }}>
        Coordinates: {lat?.toFixed(4)}, {lng?.toFixed(4)}
      </Typography>

      <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
        Time Recorded:{" "}
        {loc.timeFormatted || new Date(loc.time).toLocaleString()}
      </Typography>

      <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
        Speed: {shipSpeed}
      </Typography>

      <button onClick={onClose}>Close</button>
    </Box>
  );
}
