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
}) {
  return (
    <>
      {ships.map((ship, i) => (
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
      ))}
    </>
  );
}