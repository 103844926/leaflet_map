// src/hooks/useShipDataPageProps.js
import { useMemo } from "react";
import { defaultShipFilters } from "@/utils";

export function useShipDataPageProps({
    // ---- Shared Data ----
    ships,
    filteredShips,
    visibleShips,
    shipPositions,
    currentShips,

    shipFilters,
    setShipFilters,
    filterOptions,

    // ---- Map ----
    timeRange,
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
    setShowPaths,
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
    availableTimes,
    updateTime,
    movementMarks,
    showPaths,
    showShipTable,
    setShowShipTable,
    setSelectedShip,
    selectedShip,
    shipLatLng,
    setShipLatLng, // ✅ NEW: Need this setter
}) {
    // ------------------------
    // Ship Info Panel Props
    // ------------------------
    const infoPanelProps = useMemo(
        () =>
            selectedShip && shipLatLng
                ? {
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
        [selectedShip, shipLatLng, timeRange, boxControl, mapRef, setSelectedShip, setShipLatLng]
    );


    // ------------------------
    // Ship Layer Control Props
    // ------------------------
    const shipLayerControlProps = useMemo(
        () => ({
            ships,
            visibleShips,
            onShipToggle: handleShipToggle,
            showPaths,
            onPathToggle: setShowPaths,

            shipFilters,
            filterOptions,
            onApplyFilters: setShipFilters,
            onClearFilters: () => setShipFilters(defaultShipFilters),

            isAnimatingAll: isAnimating,
            controlRef: paperControl,
            movementMarks,
            selectedTime,

            onJumpToShip: (index) => {
                if (!mapRef.current) return;

                const pos = shipPositions[index]?.position;
                if (pos) {
                    mapRef.current.flyTo(
                        [pos.lat, pos.long],
                        mapRef.current.getZoom(),
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

            showShipTable,
            onToggleShipTable: () =>
                setShowShipTable((v) => !v),
        }),
        [
            ships,
            visibleShips,
            filterOptions,
            handleShipToggle,
            showPaths,
            setShowPaths,
            shipFilters,
            setShipFilters,
            isAnimating,
            paperControl,
            movementMarks,
            selectedTime,
            mapRef,
            shipPositions,
            handleManualTimeUpdate,
            setRecordingShipIndex,
            setShowRecordingDialog,
            setRecordingShipStartTime,
            showShipTable,
            setShowShipTable,
        ]
    );

    // ------------------------
    // Recording Control Props
    // ------------------------
    const recordingProps = useMemo(
        () => {
            // Create a ref that always has the current selectedTime
            const selectedTimeRef = { current: selectedTime };

            return {
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
                selectedTimeRef,
                onTimeChange: updateTime,

                windowStart: minTime,
                windowEnd: maxTime,

                setWindowStart: () => { },
                setWindowEnd: () => { },

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
            };
        },
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
            visibleShips,
        ]
    );

    // ------------------------
    // Ship Time Control Props
    // ------------------------
    const timeControlProps = useMemo(
        () => ({
            selectedTime,
            minTime,
            maxTime,
            availableTimes,
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
                    setIsRecordingActive(false);
                } else {
                    setShowRecordingDialog(true);
                    setShouldStopRecording(false);
                }
            },
        }),
        [
            selectedTime,
            minTime,
            maxTime,
            availableTimes,
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
            setIsRecordingActive,
        ]
    );

    // ------------------------
    // Ship Table Props
    // ------------------------
    const shipTableProps = useMemo(
        () => ({
            ships: currentShips || [],
            selectedShip,

            onSelectShip: (ship) => {
                setSelectedShip(ship);

                // ✅ NEW: Set shipLatLng when jumping from table
                if (ship?.lat != null && ship?.long != null) {
                    setShipLatLng({ lat: ship.lat, lng: ship.long });
                }

                if (!mapRef.current || !ship) return;

                // Fly to the ship's position
                mapRef.current.flyTo(
                    [ship.lat, ship.long],
                    mapRef.current.getZoom(),
                    { duration: 1.2 }
                );
            },

            onClose: () => setShowShipTable(false),
        }),
        [
            currentShips,
            selectedShip,
            setSelectedShip,
            setShipLatLng, // ✅ Add to dependencies
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