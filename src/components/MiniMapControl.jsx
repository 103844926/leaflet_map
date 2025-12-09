// src/components/MiniMap.js
import React, { useMemo, useState, useCallback } from "react";
import { Box } from "@mui/material";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvent,
  Rectangle,
} from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

// Inner component that syncs with parent map
function MinimapBounds({ parentMap, zoom }) {
  const minimap = useMap();

  // Clicking on the minimap sets the parent map's view
  const onClick = useCallback(
    (e) => {
      parentMap.setView(e.latlng, parentMap.getZoom());
    },
    [parentMap],
  );
  useMapEvent("click", onClick);

  // Keep track of bounds in state to trigger renders
  const [bounds, setBounds] = useState(parentMap.getBounds());
  const onChange = useCallback(() => {
    setBounds(parentMap.getBounds());
    minimap.setView(parentMap.getCenter(), zoom);
  }, [minimap, parentMap, zoom]);

  // Listen to events on the parent map
  const handlers = useMemo(
    () => ({ move: onChange, zoom: onChange }),
    [onChange],
  );

  useEffect(() => {
    parentMap.on(handlers);
    return () => {
      parentMap.off(handlers);
    };
  }, [parentMap, handlers]);

  return <Rectangle bounds={bounds} pathOptions={{ weight: 1 }} />;
}

// This component must be used INSIDE a MapContainer
export function MiniMapControl({ zoom }) {
  const parentMap = useMap();
  const mapZoom = zoom || 0;

  // Get center from parent map
  const center = parentMap.getCenter();

  return (
    <Box
      sx={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 1000,
        border: 2,
        borderColor: "#000",
        overflow: "hidden",
      }}
    >
      <MapContainer
        center={center}
        zoom={mapZoom}
        style={{ height: "150px", width: "150px" }}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MinimapBounds parentMap={parentMap} zoom={mapZoom} />
      </MapContainer>
    </Box>
  );
}
