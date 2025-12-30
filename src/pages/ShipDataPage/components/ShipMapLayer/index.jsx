// ShipMapLayer.jsx
import React, { useMemo, useCallback } from "react";
import { UnifiedShipLayer } from "./UnifiedShipLayer";
import { applyShipFilters } from "@/utils";
import L from "leaflet";

export const ShipMapLayer = React.memo(function ShipMapLayer({
  ships,
  currentShips,
  shipFilters,
  filteredShips,
  visibleShips,
  shipPositions,
  onShipSelect,
  timeRange,
  showPaths,
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

  const shipsToRender = useMemo(() => {
    return recordingShipIndex !== null
      ? [filteredShips[recordingShipIndex]]
      : filteredShips;
  }, [recordingShipIndex, filteredShips]);

  const onPixiShipClick = useCallback(
    (ship, pixiEvent) => {
      if (!map || !pixiEvent?.data?.global) return;

      const { x, y } = pixiEvent.data.global;

      // PIXI global → Leaflet container point
      const containerPoint = L.point(x, y);

      // container point → latlng
      const latlng = map.containerPointToLatLng(containerPoint);

      onShipSelect?.(ship, { latlng });
    },
    [map, onShipSelect]
  );

  const handleMarkerClick = useCallback(
    (index, pixiEvent) => {
      const ship = ships[index];
      onPixiShipClick(ship, pixiEvent);
    },
    [ships, onPixiShipClick]
  );

  const handleBackgroundShipClick = useCallback(
    (ship, pixiEvent) => {
      onPixiShipClick(ship, pixiEvent);
    },
    [onPixiShipClick]
  );

  return (
    <UnifiedShipLayer
      // Main ships
      ships={ships}
      filteredShips={filteredShips}
      shipsToRender={shipsToRender}
      visibleShips={visibleShips}
      shipPositions={shipPositions}
      onMarkerClick={handleMarkerClick}
      showPaths={showPaths}
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