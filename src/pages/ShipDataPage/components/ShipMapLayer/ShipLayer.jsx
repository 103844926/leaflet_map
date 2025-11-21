import { React } from "react";
import { getShipColor } from "./getShipColor";
import "leaflet/dist/leaflet.css";
import { LayerGroup, Marker, Polyline } from "react-leaflet";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { DirectionsBoat } from "@mui/icons-material";
import { useCurrentShipPosition } from "@/hooks";

export function ShipLayer({
  ship,
  index,
  onMarkerClick,
  timeRange,
  isVisible = true,
}) {
  // Use the hook to get current position
  const { location: currentLoc } = useCurrentShipPosition(ship, timeRange);

  const currentPos = [currentLoc.lat, currentLoc.long];

  const polyline = ship.locations.map((loc) => [loc.lat, loc.long]);

  // Create custom boat icon
  const boatIcon = L.divIcon({
    html: renderToStaticMarkup(
      <DirectionsBoat
        style={{
          color: getShipColor(index),
          fontSize: "30px",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          backgroundColor: "white",
        }}
      />,
    ),
    className: "custom-boat-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  if (!isVisible || !ship?.locations?.length) return null;

  return (
    <LayerGroup>
      <Marker
        position={currentPos}
        icon={boatIcon}
        eventHandlers={{ click: onMarkerClick }}
      />
      <Polyline
        pathOptions={{
          color: getShipColor(index),
          weight: 3,
        }}
        positions={polyline}
      />
    </LayerGroup>
  );
}
