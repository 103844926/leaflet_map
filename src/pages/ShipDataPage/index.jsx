import { React, useState, useCallback, useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Box } from "@mui/material";
import { AreaRulerLayer, ShipMapLayer, WeatherLayer, ShipInfoPanel, ShipInfoTable, ShipLayerControl, ShipTimeControl, LayerControl } from "./components";

import { RecordingControl } from "@/components";
import { useLeafletControl, useShipAnimation, useShipTime, useShipTracking, useShipDataPageLogic, useShipDataPageProps, useShipFilterOptions, useLayerControl } from "@/hooks";
import { defaultShipFilters } from "@/utils";

export default function ShipDataPage() {

  // --------------------
  // Basic state
  // --------------------
  const mapRef = useRef(null);

  const paperControl = useLeafletControl();
  const boxControl = useLeafletControl();
  const layerControl = useLeafletControl();
  const { showWeather, showRuler, showUI, layerConfigs } = useLayerControl();

  // Click position state
  const [selectedShip, setSelectedShip] = useState(null);
  const [shipLatLng, setShipLatLng] = useState(null);
  const [showShipTable, setShowShipTable] = useState(false);

  // Recording state
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [showRecordingDialog, setShowRecordingDialog] = useState(false);
  const [shouldStopRecording, setShouldStopRecording] = useState(false);
  const [recordingShipIndex, setRecordingShipIndex] = useState(null);
  const [recordingShipStartTime, setRecordingShipStartTime] = useState(null);
  const [trackShip, setTrackShip] = useState(false);

  // Ship filters
  const [shipFilters, setShipFilters] = useState(defaultShipFilters);

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
    movementMarks,
    windData,
    virtualMinTime,
    virtualMaxTime,
    isMobile,
  } = useShipDataPageLogic();

  const filterOptions = useShipFilterOptions(currentShips);

  // --------------------
  // Time management 
  // --------------------
  const handleTimeChange = useCallback((range) => setTimeRange(range), [setTimeRange]);

  const {
    availableTimes,
    selectedTime,
    minTime,
    maxTime,
    updateTime,
  } = useShipTime(ships, handleTimeChange);

  // ---- Recording / Time playback window (GLOBAL) ----
  const [windowStart, setWindowStart] = useState(null);
  const [windowEnd, setWindowEnd] = useState(null);

  // keep window in sync with data range
  useEffect(() => {
    setWindowStart(minTime);
    setWindowEnd(maxTime);
  }, [minTime, maxTime]);

  // --------------------
  // Animation + Ship positions
  // --------------------
  const {
    shipPositions,
    isAnimating,
    animate,
    stopAnimation,
    playbackSpeed,
    setPlaybackSpeed,
  } = useShipAnimation(ships, selectedTime);

  // Wrapper to handle ship selection with click position
  const handleShipSelect = useCallback((ship, event) => {
    setSelectedShip(ship);
    setShipLatLng(event.latlng);
  }, [setSelectedShip]);

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

  // Safety effect to make sure shouldStopRecording is cleared
  useEffect(() => {
    if (!isRecordingActive) {
      setShouldStopRecording(false);
    }
  }, [isRecordingActive]);


  // Track selected ship on map during recording
  useShipTracking({
    mapRef,
    isRecordingActive,
    trackShip,
    recordingShipIndex,
    shipPositions
  });

  // ------------------------
  // Props grouping via custom hook
  // ------------------------
  const {
    recordingProps,
    timeControlProps,
    shipLayerControlProps,
    infoPanelProps,
    shipTableProps,
  } = useShipDataPageProps({
    isMobile,
    ships,
    visibleShips,
    shipPositions,

    shipFilters,
    setShipFilters,
    filterOptions,

    timeRange,
    windowStart,
    windowEnd,
    setWindowStart,
    setWindowEnd,
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
    recordingShipStartTime,
    trackShip,
    setTrackShip,

    setRecordingShipIndex,
    setIsRecordingActive,
    setShowRecordingDialog,
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
    showShipTable,
    setShowShipTable,
    setSelectedShip,
    selectedShip,
    shipLatLng,
    setShipLatLng,
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
        {/* Component allowing video capture */}
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

        {/* RULER LAYER */}
        <AreaRulerLayer active={showRuler && !isRecordingActive && !isAnimating} />

        {/* WIND LAYER */}
        {windData && selectedTime && minTime && maxTime && showWeather && (
          <WeatherLayer
            windData={windData}
            selectedTime={selectedTime}
            minTime={virtualMinTime}
            maxTime={virtualMaxTime}
            isAnimating={isAnimating}
            isRecordingActive={isRecordingActive}
            isMobile={isMobile}
          />
        )}

        {showUI && selectedShip && (
          <ShipInfoPanel {...infoPanelProps} />
        )}

        <ShipMapLayer
          ships={ships}
          currentShips={currentShips}
          shipFilters={shipFilters}
          visibleShips={visibleShips}
          shipPositions={shipPositions}
          onShipSelect={handleShipSelect}
          recordingShipIndex={isRecordingActive ? recordingShipIndex : null}
          isRecording={isRecordingActive}
          selectedTime={selectedTime}
          selectedShipId={selectedShip?.ship_uid ?? null}
          map={mapRef.current}
        />
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
        <LayerControl layers={layerConfigs} control={layerControl} />
      )}

      <RecordingControl {...recordingProps} />

      {showUI && (
        <>
          {!isRecordingActive && (
            <ShipLayerControl {...shipLayerControlProps} />
          )}
          <ShipTimeControl {...timeControlProps} />
        </>
      )}

      {showShipTable && (
        <ShipInfoTable {...shipTableProps} />
      )}
    </Box>
  );
}