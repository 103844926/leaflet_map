// ShipMapLayer.jsx
import React, { useMemo, useCallback } from "react";
import { UnifiedShipLayer } from "./UnifiedShipLayer";
import { applyShipFilters } from "@/utils";
import L from "leaflet";

export const ShipMapLayer = React.memo(function ShipMapLayer({
  ships,
  currentShips,
  shipFilters,
  visibleShips,
  shipPositions,
  onShipSelect,
  recordingShipIndex,
  isRecording,
  selectedTime,
  selectedShipId,
  map,
}) {

  const backgroundShipsFiltered = useMemo(() => {
    return currentShips.filter((ship) =>
      applyShipFilters(ship, shipFilters)
    );
  }, [currentShips, shipFilters]);

  // Create indexed ships
  const indexedShips = useMemo(() => {
    return ships.map((ship, i) => ({
      ...ship,
      index: i
    }));
  }, [ships]);

  // Select ships to render
  const shipsToRender = useMemo(() => {
    return recordingShipIndex !== null
      ? [indexedShips[recordingShipIndex]]
      : indexedShips;
  }, [indexedShips, recordingShipIndex]);

  // Pass Pixi Click to Map Click
  const onPixiShipClick = useCallback(
    (ship, pixiEvent) => {
      if (!map || !pixiEvent?.data?.global) return;

      // PIXI global → Leaflet container point
      const { x, y } = pixiEvent.data.global;
      const containerPoint = L.point(x, y);

      // container point → latlng
      const latlng = map.containerPointToLatLng(containerPoint);

      onShipSelect?.(ship, { latlng });
    },
    [map, onShipSelect]
  );

  const handleMarkerClick = useCallback(
    (index, pixiEvent) => {
      const ship = ships[index];          // Search in indexed array before passing
      onPixiShipClick(ship, pixiEvent);
    },
    [ships, onPixiShipClick]
  );

  const handleBackgroundShipClick = useCallback(
    (ship, pixiEvent) => {
      onPixiShipClick(ship, pixiEvent);   // Pass ship right away
    },
    [onPixiShipClick]
  );

  return (
    <UnifiedShipLayer
      // Main ships
      shipsToRender={shipsToRender}
      visibleShips={visibleShips}
      shipPositions={shipPositions}
      onMarkerClick={handleMarkerClick}
      recordingShipIndex={recordingShipIndex}
      isRecording={isRecording}
      currentTime={selectedTime}

      // Background ships
      backgroundShips={backgroundShipsFiltered}
      backgroundShipColor={0x888888}
      onBackgroundShipClick={handleBackgroundShipClick}

      // Selected ship
      selectedShipId={selectedShipId}
    />
  );
});