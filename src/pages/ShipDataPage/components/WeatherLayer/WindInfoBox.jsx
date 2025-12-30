import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { createRoot } from "react-dom/client";
import { Box, Typography } from "@mui/material";
import { isValidWindData, calculateTimeIndex, sampleWindAtLatLng, calculateWindMetrics, logWindData, isMobileViewport, getInfoBoxStyles, formatCoordinates, getResponsiveVariant } from "@/utils";

function WindInfoBoxContent({ grid, selectedTime, latlng, minTime, maxTime }) {
    const isMobile = isMobileViewport();

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

    const { u, v, gridIndex } = sample;
    const { speed, speedKnots, meteoAngle, direction } = calculateWindMetrics(u, v);

    logWindData("WIND INFO BOX", {
        lat: latlng.lat,
        lng: latlng.lng,
        u, v, gridIndex, timeIndex,
        selectedTime,
        gridTime: grid.ts[timeIndex],
    });

    const styles = getInfoBoxStyles(isMobile);
    const coords = formatCoordinates(latlng.lat, latlng.lng, isMobile);

    return (
        <Box sx={{
            p: styles.padding,
            width: styles.width,
            background: styles.background,
            borderRadius: styles.borderRadius,
            boxShadow: styles.boxShadow,
        }}>
            <Typography
                variant={getResponsiveVariant("h6", isMobile)}
                fontWeight={700}
                mb={0.5}
            >
                Wind Info
            </Typography>
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
        </Box>
    );
}

export function WindInfoBox({ windData, selectedTime, minTime, maxTime, position = "bottomright" }) {
    const map = useMap();
    const controlRef = useRef(null);
    const rootRef = useRef(null);
    const [latlng, setLatlng] = useState(null);
    const [visible, setVisible] = useState(false);

    // Handle map clicks
    useEffect(() => {
        if (!map) return;
        const onClick = (e) => {
            setLatlng(e.latlng);
            setVisible(true);
        };
        map.on("click", onClick);
        return () => map.off("click", onClick);
    }, [map]);

    // Update popup position on map move/zoom
    useEffect(() => {
        if (!map || !latlng || !controlRef.current) return;

        const updatePosition = () => {
            const point = map.latLngToContainerPoint(latlng);
            const container = controlRef.current.getContainer?.();
            if (!container || !point) return;

            container.style.position = "absolute";
            container.style.left = `${point.x}px`;
            container.style.top = `${point.y}px`;
            container.style.transform = "translate(-50%, -100%)";
            container.style.marginTop = "-10px";
        };

        updatePosition();

        map.on("move", updatePosition);
        map.on("zoom", updatePosition);

        return () => {
            map.off("move", updatePosition);
            map.off("zoom", updatePosition);
        };
    }, [map, latlng]);


    // Create control
    useEffect(() => {
        if (!map || !windData) return;

        const isMobile = isMobileViewport();

        const Control = L.Control.extend({
            onAdd() {
                const div = L.DomUtil.create("div");
                L.DomEvent.disableClickPropagation(div);
                L.DomEvent.disableScrollPropagation(div);
                const root = createRoot(div);
                rootRef.current = root;
                return div;
            },
            onRemove() {
                if (rootRef.current) {
                    const rootToUnmount = rootRef.current;
                    rootRef.current = null;
                    Promise.resolve().then(() => {
                        try {
                            rootToUnmount.unmount();
                        } catch (err) {
                            console.warn("WindInfoBox unmount warning:", err);
                        }
                    });
                }
            }
        });

        const c = new Control({ position: isMobile ? "topleft" : position });
        c.addTo(map);
        controlRef.current = c;
        return () => c.remove();
    }, [map, windData, position]);

    // Update content
    useEffect(() => {
        if (!rootRef.current) return;
        rootRef.current.render(
            visible ? (
                <WindInfoBoxContent
                    grid={windData}
                    selectedTime={selectedTime}
                    minTime={minTime}
                    maxTime={maxTime}
                    latlng={latlng}
                />
            ) : null
        );
    }, [latlng, selectedTime, windData, visible, minTime, maxTime]);

    return null;
}