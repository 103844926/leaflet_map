import { React, useState, useCallback, useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Box, Paper, Typography } from "@mui/material";
import { ShipMapLayer, ShipInfoPanel, ShipLayerControl, ShipTimeControl } from "./components";
import { MiniMapControl, RecordingControl } from "@/components";
import { useShipAnimation, useShipTime, useShipDataPageLogic, useLeafletControl } from "@/hooks";

export default function ShipDataPage() {
  // --------------------
  // Basic state
  // --------------------
  const [showPaths, setShowPaths] = useState(true);

  const mapRef = useRef(null);

  const paperControl = useLeafletControl();
  const boxControl = useLeafletControl();

  // Recording state
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [showRecordingDialog, setShowRecordingDialog] = useState(false);
  const [shouldStopRecording, setShouldStopRecording] = useState(false);


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

  function MapInstanceCapture({ mapRef }) {
    const map = useMap();

    useEffect(() => {
      if (map && mapRef) {
        mapRef.current = map;
      }
    }, [map, mapRef]);

    return null;
  }

  const formatDateTime = (ts) =>
    ts
      ? new Date(ts).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      })
      : "No data";

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
        preferCanvas={true}
        style={{ height: "100%", width: "100%" }}
      >
        {/* ADD THIS COMPONENT RIGHT AFTER MapContainer opens */}
        <MapInstanceCapture mapRef={mapRef} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          maxZoom={19}
          tileSize={512}
          zoomOffset={-1}
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

        {/* TIME DISPLAY - Bottom Left Corner During Recording */}
        {isRecordingActive && (
          <Paper
            elevation={8}
            sx={{
              position: "fixed",
              bottom: 32,
              left: 32,
              px: 3,
              py: 2,
              zIndex: 1001,
              borderRadius: 2,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
            }}
          >
            <Typography
              variant="h4"
              fontWeight="600"
              sx={{
                fontSize: "1rem",
                color: "white",
              }}
            >
              {formatDateTime(selectedTime)}
            </Typography>
          </Paper>
        )}

      </MapContainer>

      {isRecordingActive && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 999,
            backgroundColor: "rgba(0,0,0,0)",
            pointerEvents: "auto",
          }}
        />
      )}

      {!isRecordingActive && (
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
      )}

      {/* ADD RecordingControl HERE - Now at ShipDataPage level */}
      <RecordingControl
        shouldStop={shouldStopRecording}
        isAnimating={isAnimating}
        onStartAnimation={(start, end) => animate(start, start, end, updateTime)}
        onStopAnimation={stopAnimation}
        mapRef={mapRef}
        minTime={minTime}
        maxTime={maxTime}
        selectedTime={selectedTime}
        onTimeChange={updateTime}
        windowStart={minTime}
        windowEnd={maxTime}
        setWindowStart={() => { }} // dummy since we're not using it here
        setWindowEnd={() => { }} // dummy since we're not using it here
        onRecordingStateChange={setIsRecordingActive}
        showDialog={showRecordingDialog}
        onDialogChange={setShowRecordingDialog}
      />

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
        mapRef={mapRef}
        isRecordingActive={isRecordingActive} // ADD 
        onRecordingButtonClick={() => {
          if (isRecordingActive) {
            // Stop recording
            setShouldStopRecording(true);
          } else {
            // Start recording (open dialog)
            setShowRecordingDialog(true);
            setShouldStopRecording(false);
          }
        }} // ADD
      />
    </Box>
  );
}