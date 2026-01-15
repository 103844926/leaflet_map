import React, { useEffect, useRef, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import L from "leaflet";
import { formatCoordinates, getResponsiveVariant } from "@/utils";

export function ShipInfoPanel({
  isMobile,
  ship,
  timeRange,
  onClose,
  controlRef,
  map
}) {

  /* ===============================
     Resolve ship locations
  =============================== */
  const resolveLocations = useCallback(() => {
    if (Array.isArray(ship?.locations) && ship.locations.length > 0) {
      return ship.locations;
    }

    if (ship?.isCurrentPosition && ship.lat != null && ship.long != null) {
      return [
        {
          lat: ship.lat,
          long: ship.long,
          time: ship.crawl_time ?? Date.now(),
          timeFormatted: ship.crawl_time
            ? new Date(ship.crawl_time).toLocaleString()
            : "Current position"
        }
      ];
    }

    return null;
  }, [ship]);

  /* ===============================
     Local DOM ref - Used only for positioning
  =============================== */
  const panelRef = useRef(null);

  /* ===============================
     Resolve active ship position
     - Accounts for timeRange
  =============================== */
  const getCurrentPosition = useCallback(() => {
    const locations = resolveLocations();
    if (!locations) return null;

    let index = locations.length - 1;

    if (timeRange && locations.length > 1) {
      const lastVisibleIndex = locations.findIndex(
        loc => loc.time > timeRange[1]
      );

      index =
        lastVisibleIndex === -1
          ? locations.length - 1
          : Math.max(0, lastVisibleIndex - 1);
    }

    return {
      index,
      location: locations[index]
    };
  }, [resolveLocations, timeRange]);

  /* ===============================
     Position panel above ship (mobile)
     - Anchored using Leaflet projection
     - Repositions on pan / zoom
  =============================== */
  useEffect(() => {
    if (!isMobile) return;
    if (!map || !panelRef.current) return;

    const el = panelRef.current;
    const mapContainer = map.getContainer();

    // Ensure positioning context
    mapContainer.style.position = "relative";
    if (!mapContainer.contains(el)) {
      mapContainer.appendChild(el);
    }

    const currentLoc = getCurrentPosition()?.location;
    if (!currentLoc) return;

    const lat = currentLoc.lat ?? currentLoc.latitude;
    const lng = currentLoc.long ?? currentLoc.lng ?? currentLoc.longitude;
    if (lat == null || lng == null) return;

    const latlng = L.latLng(lat, lng);

    const updatePosition = () => {
      const point = map.latLngToContainerPoint(latlng);

      el.style.left = `${point.x}px`;
      el.style.top = `${point.y}px`;
      el.style.transform = "translate(-50%, -100%)";
      el.style.marginTop = "-10px";
    };

    updatePosition();

    map.on("move", updatePosition);
    map.on("zoom", updatePosition);

    return () => {
      map.off("move", updatePosition);
      map.off("zoom", updatePosition);
    };
  }, [isMobile, map, ship, timeRange, getCurrentPosition]);

  /* ===============================
     Render guard
  =============================== */
  const current = getCurrentPosition();
  if (!current) return null;

  const loc = current.location;
  const lat = loc.lat ?? loc.latitude;
  const lng = loc.long ?? loc.lng ?? loc.longitude;

  const shipId = ship.name ?? ship.ship_uid ?? "Unknown";
  const shipSpeed =
    loc?.speed ?? ship.speed
      ? `${loc?.speed ?? ship.speed} knots`
      : "Unknown";

  const coords = formatCoordinates(lat, lng, isMobile);

  /* ===============================
     Render
  =============================== */
  return (
    <Box
      ref={(el) => {
        panelRef.current = el;   // DOM positioning
        controlRef?.(el);        // Disable Leaflet propagation
      }}
      sx={{
        position: "absolute",
        backgroundColor: "white",
        bottom: isMobile ? "" : 0,
        right: isMobile ? "" : 0,
        padding: isMobile ? "10px" : "15px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        zIndex: 1000,
        width: "auto"
      }}
    >
      <Typography
        variant={getResponsiveVariant("body1", isMobile)}
        sx={{ fontWeight: 600, mb: 0.5 }}
      >
        Ship: {shipId}
      </Typography>

      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {coords}
      </Typography>

      <Typography variant="body2" sx={{ mb: 0.5, color: "#666" }}>
        {loc.timeFormatted || new Date(loc.time).toLocaleString()}
      </Typography>

      <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
        Speed: {shipSpeed}
      </Typography>

      <button onClick={onClose}>Close</button>
    </Box>
  );
}
