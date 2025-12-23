// ShipMapLayer.jsx
import React, { useMemo, useState, useCallback } from "react";
import { UnifiedShipLayer } from "./UnifiedShipLayer";
import { applyShipFilters } from "@/utils";

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

  const handleMarkerClick = useCallback(
    (index) => {
      const ship = filteredShips[index];
      if (!ship) return;

      onShipSelect?.(ship);
    },
    [filteredShips, onShipSelect]
  );


  const handleBackgroundShipClick = useCallback(
    (ship) => {
      onShipSelect?.(ship);
    },
    [onShipSelect]
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