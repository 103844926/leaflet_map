import { React, useState, useCallback, useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Box } from "@mui/material";
import { ShipMapLayer, WeatherLayer, ShipInfoPanel, ShipLayerControl, ShipTimeControl } from "./components";
import { MiniMapControl, RecordingControl } from "@/components";
import { useLeafletControl, useShipAnimation, useShipTime, useShipTracking, useShipDataPageLogic, useShipDataPageProps } from "@/hooks";

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
  const [recordingShipIndex, setRecordingShipIndex] = useState(null);
  const [recordingShipStartTime, setRecordingShipStartTime] = useState(null);
  const [trackShip, setTrackShip] = useState(false);


  // --------------------------
  // Load ships data and filter
  // --------------------------
  const {
    ships,
    currentShips,
    initialCenter,
    timeRange,
    setTimeRange,
    visibleShips,
    handleShipToggle,
    showBackgroundShips, // ADD THIS
    toggleBackgroundShips, // ADD THIS
    filteredShips,
    movementMarks,
    windData,
    virtualMinTime,
    virtualMaxTime,
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

  const selectedTimeRef = useRef(selectedTime);

  useEffect(() => {
    selectedTimeRef.current = selectedTime;
  }, [selectedTime]);

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

  // ------------------------
  // Props grouping via custom hook
  // ------------------------
  const {
    recordingProps,
    timeControlProps,
    shipLayerControlProps,
    infoPanelProps,
  } = useShipDataPageProps({
    ships,
    filteredShips,
    visibleShips,
    shipPositions,
    timeRange,
    showBackgroundShips,
    toggleBackgroundShips,

    mapRef,
    paperControl,
    boxControl,

    shouldStopRecording,
    isRecordingActive,
    showRecordingDialog,
    recordingShipIndex,
    minTime,
    maxTime,
    selectedTime,
    selectedTimeRef,
    recordingShipStartTime,
    trackShip,
    setTrackShip,

    setRecordingShipIndex,
    setIsRecordingActive,
    setShowRecordingDialog,
    setShowPaths,
    handleShipToggle,
    handleManualTimeUpdate,
    setShouldStopRecording,
    setRecordingShipStartTime,

    isAnimating,
    animate,
    stopAnimation,
    playbackSpeed,
    setPlaybackSpeed,

    availableTimes,
    updateTime,
    movementMarks,
    showPaths,
    setSelectedShipIndex,
    selectedShipIndex,
  });


  // Track selected ship on map during recording
  useShipTracking({
    mapRef,
    isRecordingActive,
    trackShip,
    recordingShipIndex,
    shipPositions
  });


  function MapInstanceCapture({ mapRef }) {
    const map = useMap();

    useEffect(() => {
      if (map && mapRef) {
        mapRef.current = map;
      }
    }, [map, mapRef]);

    return null;
  }

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
        zoomControl={false}
      >
        {/* ADD THIS COMPONENT RIGHT AFTER MapContainer opens */}
        <MapInstanceCapture mapRef={mapRef} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          subdomains="abc"
          crossOrigin="anonymous"
          maxZoom={19}
          tileSize={512}
          zoomOffset={-1}
        />

        {/* ADD WIND LAYER HERE */}
        {windData && selectedTime && minTime && maxTime && !isAnimating && (
          <WeatherLayer
            windData={windData}
            selectedTime={selectedTime}
            minTime={virtualMinTime}
            maxTime={virtualMaxTime}
          />
        )}

        {selectedShipIndex !== null && filteredShips[selectedShipIndex] && (
          <ShipInfoPanel {...infoPanelProps} />
        )}


        <ShipMapLayer
          ships={ships}
          currentShips={currentShips}
          showBackgroundShips={showBackgroundShips}
          filteredShips={filteredShips}
          visibleShips={visibleShips}
          shipPositions={shipPositions}
          onMarkerClick={setSelectedShipIndex}
          timeRange={timeRange}
          showPaths={showPaths}
          recordingShipIndex={isRecordingActive ? recordingShipIndex : null}
          isRecording={isRecordingActive}
          selectedTime={selectedTime}  // ADD THIS LINE
        />

        <MiniMapControl zoom={5} />

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
        <ShipLayerControl {...shipLayerControlProps} />
      )}

      {/* ADD RecordingControl HERE - Now at ShipDataPage level */}
      <RecordingControl {...recordingProps} />

      <ShipTimeControl {...timeControlProps} />
    </Box>
  );
}