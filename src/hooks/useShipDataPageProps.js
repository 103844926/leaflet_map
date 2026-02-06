// src/hooks/useShipDataPageProps.js
import { useMemo } from "react";
import { defaultShipFilters } from "@/utils";

export function useShipDataPageProps({
    // ---- Shared Data ----
    isMobile,
    ships,
    visibleShips,
    shipPositions,

    shipFilters,
    setShipFilters,
    filterOptions,

    // ---- Map ----
    timeRange,
    windowStart,
    windowEnd,
    setWindowStart,
    setWindowEnd,
    mapRef,
    paperControl,
    boxControl,

    // ---- Recording ----
    shouldStopRecording,
    isRecordingActive,
    showRecordingDialog,
    recordingShipIndex,
    minTime,
    maxTime,
    selectedTime,
    recordingShipStartTime,
    trackShip,

    // ---- Setters ----
    setRecordingShipIndex,
    setIsRecordingActive,
    setShowRecordingDialog,
    handleShipToggle,
    handleManualTimeUpdate,
    setShouldStopRecording,
    setRecordingShipStartTime,
    setTrackShip,

    // ---- Animation ----
    isAnimating,
    animate,
    stopAnimation,
    playbackSpeed,
    setPlaybackSpeed,

    // ---- Time ----
    updateTime,
    movementMarks,
    setShowShipTable,
    setSelectedShip,
    selectedShip,
    shipLatLng,
    setShipLatLng,
}) {
    // ------------------------
    // Ship Info Panel Props
    // ------------------------
    const infoPanelProps = useMemo(
        () =>
            selectedShip && shipLatLng
                ? {
                    isMobile,
                    ship: selectedShip,
                    timeRange,
                    onClose: () => {
                        setSelectedShip(null);
                        setShipLatLng(null); // ✅ Clear both states
                    },
                    controlRef: boxControl,
                    map: mapRef.current,
                }
                : null,
        [isMobile, selectedShip, shipLatLng, timeRange, boxControl, mapRef, setSelectedShip, setShipLatLng]
    );


    // ------------------------
    // Ship Layer Control Props
    // ------------------------
    const shipLayerControlProps = useMemo(
        () => ({
            isMobile,
            ships,
            visibleShips,
            onShipToggle: handleShipToggle,

            shipFilters,
            filterOptions,
            onApplyFilters: setShipFilters,
            onClearFilters: () => setShipFilters(defaultShipFilters),

            isAnimatingAll: isAnimating,
            controlRef: paperControl,
            movementMarks,

            onJumpToShip: (index) => {
                if (!mapRef.current) return;

                const pos = shipPositions[index]?.position;
                if (pos) {
                    mapRef.current.flyTo(
                        [pos.lat, pos.long],
                        15,
                        { duration: 1.5 }
                    );
                }
            },

            onJumpToStartTime: (_, startTime) => {
                handleManualTimeUpdate(startTime);
            },

            onRecordingShipChange: setRecordingShipIndex,
            onDialogChange: (show, shipStartTime) => {
                setShowRecordingDialog(show);
                if (shipStartTime !== undefined) {
                    setRecordingShipStartTime(shipStartTime);
                }
            },

            onToggleShipTable: () =>
                setShowShipTable((v) => !v),
        }),
        [
            isMobile,
            ships,
            visibleShips,
            handleShipToggle,
            shipFilters,
            filterOptions,
            setShipFilters,
            isAnimating,
            paperControl,
            movementMarks,
            mapRef,
            shipPositions,
            handleManualTimeUpdate,
            setRecordingShipIndex,
            setShowRecordingDialog,
            setRecordingShipStartTime,
            setShowShipTable,
        ]
    );

    // ------------------------
    // Recording Control Props
    // ------------------------
    const recordingProps = useMemo(
        () => ({
            shouldStop: shouldStopRecording,
            isAnimating,
            onStartAnimation: (start, end) =>
                animate(start, start, end, updateTime),
            onStopAnimation: stopAnimation,
            mapRef,

            ships,
            visibleShips,
            selectedRecordingShip: recordingShipIndex,
            onRecordingShipChange: setRecordingShipIndex,

            minTime,
            maxTime,
            selectedTime,
            onTimeChange: updateTime,
            setWindowStart,
            setWindowEnd,

            onRecordingStateChange: setIsRecordingActive,
            showDialog: showRecordingDialog,

            onDialogChange: (show, shipStartTime) => {
                setShowRecordingDialog(show);
                if (show) {
                    setShouldStopRecording(false);
                }
                if (shipStartTime !== undefined) {
                    setRecordingShipStartTime(shipStartTime);
                }
            },
            initialStartTime: recordingShipStartTime,
            trackShip,
            onTrackShipChange: setTrackShip,
            movementMarks,
            playbackSpeed,
            setPlaybackSpeed,
        }),
        [
            shouldStopRecording,
            isAnimating,
            animate,
            updateTime,
            stopAnimation,
            mapRef,
            ships,
            recordingShipIndex,
            setRecordingShipIndex,
            minTime,
            maxTime,
            selectedTime,
            setIsRecordingActive,
            showRecordingDialog,
            setShowRecordingDialog,
            recordingShipStartTime,
            setRecordingShipStartTime,
            setShouldStopRecording,
            trackShip,
            setTrackShip,
            movementMarks,
            playbackSpeed,
            setPlaybackSpeed,
            visibleShips,
            setWindowStart,
            setWindowEnd,
        ]
    );

    // ------------------------
    // Ship Time Control Props
    // ------------------------
    const timeControlProps = useMemo(
        () => ({
            isMobile,
            selectedTime,
            minTime,
            maxTime,
            windowStart,
            windowEnd,
            setWindowStart,
            setWindowEnd,
            isAnimating,
            playbackSpeed,
            onTimeChange: handleManualTimeUpdate,
            onAnimate: animate,
            onStop: stopAnimation,
            onPlaybackSpeedChange: setPlaybackSpeed,
            mapRef,
            isRecordingActive,
            movementMarks: Array.from(movementMarks.values()).sort((a, b) => a.time - b.time),

            onRecordingButtonClick: () => {
                if (isRecordingActive) {
                    setShouldStopRecording(true);
                } else {
                    setShowRecordingDialog(true);
                    setShouldStopRecording(false);
                }
            },
        }),
        [
            isMobile,
            selectedTime,
            minTime,
            maxTime,
            windowStart,
            windowEnd,
            setWindowStart,
            setWindowEnd,
            isAnimating,
            playbackSpeed,
            handleManualTimeUpdate,
            animate,
            stopAnimation,
            setPlaybackSpeed,
            mapRef,
            isRecordingActive,
            movementMarks,
            setShouldStopRecording,
            setShowRecordingDialog,
        ]
    );

    // ------------------------
    // Ship Table Props
    // ------------------------
    const shipTableProps = useMemo(
        () => ({
            isMobile,
            selectedShip,

            onSelectShip: (ship) => {
                setSelectedShip(ship);

                // Fix: Check for the actual property names your ships have
                const lat = ship?.lat ?? ship?.ship_lat ?? ship?.latitude;
                const lng = ship?.long ?? ship?.ship_long ?? ship?.lng ?? ship?.longitude;

                if (lat != null && lng != null) {
                    setShipLatLng({ lat, lng });
                }

                if (!mapRef.current || !ship) return;

                mapRef.current.flyTo(
                    [lat, lng],  // Use the resolved coordinates
                    15,
                    { duration: 1.2 }
                );
            },
            onClose: () => setShowShipTable(false),
        }),
        [
            isMobile,
            selectedShip,
            setSelectedShip,
            setShipLatLng,
            mapRef,
            setShowShipTable,
        ]
    );

    return {
        recordingProps,
        timeControlProps,
        shipLayerControlProps,
        infoPanelProps,
        shipTableProps,
    };
}