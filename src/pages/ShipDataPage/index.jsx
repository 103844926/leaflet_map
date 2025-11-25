import { React, useState, useCallback, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import { Box } from "@mui/material";
import { ShipMapLayer, ShipInfoPanel, ShipLayerControl, ShipTimeControl } from "./components";
import { MiniMapControl } from "@/components";
import { useShipAnimation, useShipTime, useShipDataPageLogic, useLeafletControl } from "@/hooks";

export default function ShipDataPage() {
  // --------------------
  // Basic state
  // --------------------
  const [showPaths, setShowPaths] = useState(true);

  const mapRef = useRef(null);

  const paperControl = useLeafletControl();
  const boxControl = useLeafletControl();


  // --------------------------
  // Load ships data and filter
  // --------------------------
  const {
    ships,
    initialCenter,
    timeRange,
    setTimeRange,
    visibleShips,
    handleShipToggle,
    filteredShips,
  } = useShipDataPageLogic();

  // --------------------
  // Time management (no animation)
  // --------------------
  const handleTimeChange = useCallback((range) => setTimeRange(range), [setTimeRange]);

  const {
    availableTimes,
    selectedTime,
    minTime,
    maxTime,
    updateTime,
  } = useShipTime(ships, handleTimeChange);

  // --------------------
  // Animation + Ship positions
  // --------------------
  const {
    selectedShipIndex,
    setSelectedShipIndex,
    shipPositions,
    isAnimating,
    animate,
    stopAnimation,
    playbackSpeed,
    setPlaybackSpeed,
  } = useShipAnimation(ships, selectedTime);

  // Wrapper to update time (stops animation if user touches slider)
  const handleManualTimeUpdate = useCallback(
    (newTime) => {
      if (isAnimating) {
        stopAnimation();
      }
      updateTime(newTime);
    },
    [isAnimating, stopAnimation, updateTime],
  );

  if (!initialCenter) return <div>Loading map...</div>;

  // --------------------
  // Render
  // --------------------
  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
        width: "100%",
        backgroundColor: "#999",
        padding: { xs: "10px", md: "20px" },
        boxSizing: "border-box",
      }}
    >
      <MapContainer
        ref={mapRef}
        center={initialCenter}
        zoom={10}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          maxZoom={19}
          tileSize={512}
          zoomOffset={-1}
        />

        <ShipLayerControl
          ships={ships}
          visibleShips={visibleShips}
          onShipToggle={(index) => {
            const wasVisible = visibleShips[index];
            handleShipToggle(index);
            if (wasVisible || !mapRef.current) return;

            const pos = shipPositions[index]?.position;
            if (pos) mapRef.current.flyTo([pos.lat, pos.long], mapRef.current.getZoom(), { duration: 1.5 });
          }}

          showPaths={showPaths}
          onPathToggle={setShowPaths}
          isAnimatingAll={isAnimating}
          controlRef={paperControl}
        />

        {selectedShipIndex !== null && filteredShips[selectedShipIndex] && (
          <ShipInfoPanel
            ship={filteredShips[selectedShipIndex]}
            timeRange={timeRange}
            onClose={() => setSelectedShipIndex(null)}
            controlRef={boxControl}
          />
        )}

        <ShipMapLayer
          ships={ships}
          filteredShips={filteredShips}
          visibleShips={visibleShips}
          shipPositions={shipPositions}
          onMarkerClick={setSelectedShipIndex}
          timeRange={timeRange}
          showPaths={showPaths}
        />

        <MiniMapControl zoom={5} />
      </MapContainer>

      <ShipTimeControl
        selectedTime={selectedTime}
        minTime={minTime}
        maxTime={maxTime}
        availableTimes={availableTimes}
        isAnimating={isAnimating}
        playbackSpeed={playbackSpeed}
        onTimeChange={handleManualTimeUpdate}
        onAnimate={animate}
        onStop={stopAnimation}
        onPlaybackSpeedChange={setPlaybackSpeed}
      />
    </Box>
  );
}
