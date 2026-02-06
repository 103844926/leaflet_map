import { useEffect, useRef } from 'react';

export function useShipTracking({
    mapRef,
    isRecordingActive,
    trackShip,
    recordingShipIndex,
    shipPositions
}) {
    const lastPositionRef = useRef(null);
    const animationFrameRef = useRef(null);

    useEffect(() => {
        // Stop tracking if not recording or no ship to track
        if (!isRecordingActive || !trackShip || recordingShipIndex === null) {
            lastPositionRef.current = null;
            // Stop animation frame loop if exists
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            return;
        }

        const updateMapPosition = () => {
            const map = mapRef.current;
            if (!map) return;

            const shipData = shipPositions[recordingShipIndex];
            if (!shipData?.position) return;

            const { lat, long } = shipData.position;

            const lastPos = lastPositionRef.current;
            if (lastPos) {
                const distance = Math.sqrt(
                    Math.pow(lat - lastPos.lat, 2) +
                    Math.pow(long - lastPos.long, 2)
                );

                // Skip setView if movement is negligible (less than ~10 meters)
                if (distance < 0.0001) {
                    animationFrameRef.current = requestAnimationFrame(updateMapPosition);
                    return;
                }
            }

            // Update map position
            map.setView([lat, long], map.getZoom(), {
                animate: false,
                duration: 0
            });

            lastPositionRef.current = { lat, long };

            // Continue tracking
            animationFrameRef.current = requestAnimationFrame(updateMapPosition);
        };

        // Start tracking loop
        updateMapPosition();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isRecordingActive, trackShip, recordingShipIndex, shipPositions, mapRef]);
}