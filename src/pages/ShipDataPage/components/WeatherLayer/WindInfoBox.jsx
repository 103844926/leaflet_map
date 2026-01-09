import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { createRoot } from "react-dom/client";
import { Box, Typography, Stack } from "@mui/material";
import { isValidWindData, calculateTimeIndex, sampleWindAtLatLng, calculateWindMetrics, getInfoBoxStyles, formatCoordinates, getResponsiveVariant } from "@/utils";

function WindInfoBoxContent({ grid, selectedTime, latlng, minTime, maxTime, isMobile, visible }) {

    if (!isValidWindData(grid) || !latlng) return null;

    const timeIndex = calculateTimeIndex(selectedTime, minTime, maxTime, grid.ts.length);
    const sample = sampleWindAtLatLng(grid, latlng.lat, latlng.lng, timeIndex);

    if (!sample || sample.u == null || sample.v == null) {
        return (
            <Box p={isMobile ? 1 : 2}>
                <Typography variant="body2">No wind data</Typography>
            </Box>
        );
    }

    const { u, v } = sample;
    const { speed, speedKnots, meteoAngle, direction } = calculateWindMetrics(u, v);

    const styles = getInfoBoxStyles(isMobile);
    const coords = formatCoordinates(latlng.lat, latlng.lng, isMobile);

    return (
        <Box sx={{ p: 0, background: "transparent", boxShadow: "none" }}>
            <Typography
                variant={getResponsiveVariant("h6", isMobile)}
                fontWeight={700}
                mb={0.5}
            >
                Wind Info
            </Typography>
            <Stack spacing={0.25}>
                <Typography variant="body2" fontSize={styles.fontSize}>
                    <strong>Speed:</strong> {speed.toFixed(1)} m/s {!isMobile && `(${speedKnots.toFixed(1)} kt)`}
                </Typography>
                <Typography variant="body2" fontSize={styles.fontSize}>
                    <strong>Direction:</strong> {direction} ({meteoAngle.toFixed(0)}°)
                </Typography>
                <Typography variant="body2" fontSize={styles.fontSize}>
                    <strong>Position:</strong> {coords}
                </Typography>
                {!isMobile && (
                    <Typography variant="body2" fontSize={styles.fontSize}>
                        <strong>Time:</strong> {new Date(grid.ts[timeIndex]).toLocaleString()}
                    </Typography>
                )}
            </Stack>
        </Box>
    );
}

export function WindInfoBox({ windData, selectedTime, minTime, maxTime, isMobile, visible, position = "bottomright" }) {
    const map = useMap();
    const popupRef = useRef(null);
    const rootRef = useRef(null);
    const isMountedRef = useRef(null);
    const [latlng, setLatlng] = useState(null);

    // Handle map click
    useEffect(() => {
        if (!map || !visible) return;

        const onClick = (e) => {
            setLatlng(e.latlng);
        };

        map.on("click", onClick);

        return () => map.off("click", onClick);
    }, [map, visible]);

    // Close popup when animating or recording
    useEffect(() => {
        if (!visible && popupRef.current) {
            map.closePopup(popupRef.current);
            popupRef.current = null;
            setLatlng(null);
        }
    }, [visible, map]);

    // Create / update popup
    useEffect(() => {
        if (!map || !latlng || !windData || !visible) return;

        // Cleanup previous popup
        if (popupRef.current) {
            map.closePopup(popupRef.current);
        }

        const container = L.DomUtil.create("div");
        L.DomEvent.disableClickPropagation(container);

        const root = createRoot(container);
        rootRef.current = root;

        root.render(
            <WindInfoBoxContent
                grid={windData}
                selectedTime={selectedTime}
                minTime={minTime}
                maxTime={maxTime}
                latlng={latlng}
                isMobile={isMobile}
            />
        );
        isMountedRef.current = true;

        const popup = L.popup({
            className: "wind-info-popup",
            minWidth: isMobile ? 150 : 220,
            maxWidth: isMobile ? 180 : 260,
            closeButton: true,
            autoPan: true,
            autoClose: true,
            offset: [0, -10],
        })
            .setLatLng(latlng)
            .setContent(container);

        map.openPopup(popup);
        popupRef.current = popup;

        popup.on("remove", () => {
            if (isMountedRef.current) {
                isMountedRef.current = false;
                root.unmount();
            }
        });

        return () => {
            map.closePopup(popup);
        };
    }, [
        map,
        latlng,
        windData,
        selectedTime,
        minTime,
        maxTime,
        isMobile,
        visible,
    ]);

    return null;
}