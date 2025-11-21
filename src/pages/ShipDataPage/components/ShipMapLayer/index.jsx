import { React } from "react";
import { ShipLayer } from "./ShipLayer";

export function ShipMapLayer({
  ships,
  filteredShips,
  visibleShips,
  shipPositions,
  onMarkerClick,
  timeRange,
}) {
  return (
    <>
      {ships.map((ship, i) => (
        <ShipLayer
          key={ship.ship_uid}
          ship={filteredShips[i]}
          index={i}
          currentPositionIndex={shipPositions[i]}
          onMarkerClick={() => onMarkerClick(i)}
          timeRange={timeRange}
          isVisible={visibleShips[i]} // <-- pass visibility here
        />
      ))}
    </>
  );
}
