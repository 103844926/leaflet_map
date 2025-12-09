// ShipMapLayer.jsx
import React, { useMemo } from "react";
import { UnifiedShipLayer } from "./UnifiedShipLayer";

export const ShipMapLayer = React.memo(function ShipMapLayer({
  ships,
  currentShips,
  showBackgroundShips,
  filteredShips,
  visibleShips,
  shipPositions,
  onMarkerClick,
  timeRange,
  showPaths,
  recordingShipIndex,
  isRecording,
  selectedTime,
}) {
  const shipsToRender = useMemo(() => {
    return recordingShipIndex !== null
      ? [filteredShips[recordingShipIndex]]
      : filteredShips;
  }, [recordingShipIndex, filteredShips]);

  return (
    <UnifiedShipLayer
      // Main ships
      ships={ships}
      filteredShips={filteredShips}
      shipsToRender={shipsToRender}
      visibleShips={visibleShips}
      shipPositions={shipPositions}
      onMarkerClick={onMarkerClick}
      showPaths={showPaths}
      recordingShipIndex={recordingShipIndex}
      isRecording={isRecording}
      currentTime={selectedTime}

      // Background ships
      backgroundShips={currentShips}
      showBackgroundShips={showBackgroundShips}
      backgroundShipColor={0x888888}
    />
  );
});