import { React } from "react";
import "leaflet/dist/leaflet.css";
import { LayerGroup, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { DirectionsBoat } from "@mui/icons-material";

// Ship color palette
const getShipColor = (index) => {
  const colors = ["lime", "blue", "red", "orange", "purple", "cyan", "magenta", "yellow"];
  return colors[index % colors.length];
};

export function ShipLayer({
  ship,
  index,
  onMarkerClick,
  timeRange,
  isVisible = true,
  interpolatedPosition,
  showPath = true,
}) {
  if (!isVisible || !ship?.locations?.length) return null;

  const currentLoc = interpolatedPosition?.position || ship.locations[0];
  const currentPos = [currentLoc.lat, currentLoc.long];

  // Animate path: take all previous positions + current interpolated
  let animatedPolyline = [];
  if (interpolatedPosition) {
    const prevIndex = interpolatedPosition.index || 0;
    // Add all locations up to prevIndex
    animatedPolyline = ship.locations
      .slice(0, prevIndex + 1)
      .map((loc) => [loc.lat, loc.long]);
    // Add interpolated current position as the last point
    animatedPolyline.push([currentLoc.lat, currentLoc.long]);
  } else {
    animatedPolyline = ship.locations.map((loc) => [loc.lat, loc.long]);
  }

  const boatIcon = L.divIcon({
    html: renderToStaticMarkup(
      <DirectionsBoat
        style={{
          color: getShipColor(index),
          fontSize: "24px",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          backgroundColor: "white",
        }}
      />
    ),
    className: "custom-boat-icon",
    iconSize: [24, 24],
    iconAnchor: [16, 16],
  });

  return (
    <LayerGroup>
      <Marker
        position={currentPos}
        icon={boatIcon}
        eventHandlers={{ click: onMarkerClick }}
      />
      {showPath && (
        <Polyline
          pathOptions={{
            color: getShipColor(index),
            weight: 2,
            opacity: 0.5,
          }}
          positions={animatedPolyline}
        />
      )}
    </LayerGroup>
  );
}
