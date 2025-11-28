import { React } from "react";
import { ShipLayer } from "./ShipLayer";

export function ShipMapLayer({
  ships,
  filteredShips,
  visibleShips,
  shipPositions,
  onMarkerClick,
  timeRange,
  showPaths,
  recordingShipIndex,
}) {

  // ------------------------
  // Determine ships to render
  // ------------------------
  const shipsToRender =
    recordingShipIndex !== null
      ? [filteredShips[recordingShipIndex]]
      : filteredShips;

  return (
    <>
      {shipsToRender.map((ship) => {
        const i = ship.index;   // <-- ALWAYS correct index from original ships[]

        // Skip broken / missing ships
        if (!ships[i] || !filteredShips[i]) return null;

        return (
          <ShipLayer
            key={ship.ship_uid}
            ship={filteredShips[i]} // For animated path
            fullRouteShip={ships[i]} // For complete dotted path
            index={i}
            interpolatedPosition={shipPositions[i]}
            onMarkerClick={() => onMarkerClick(i)}
            timeRange={timeRange}
            isVisible={visibleShips[i]}
            showPath={showPaths}
          />
        );
      })}
    </>
  );
}