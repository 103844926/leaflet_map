import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { createRoot } from "react-dom/client";
import { Box, Typography } from "@mui/material";
import { isValidWindData, calculateTimeIndex, sampleWindAtLatLng, calculateWindMetrics, logWindData } from "@/utils";

function WindInfoBoxContent({ grid, selectedTime, latlng, minTime, maxTime }) {
    if (!isValidWindData(grid) || !latlng) return null;

    const timeIndex = calculateTimeIndex(selectedTime, minTime, maxTime, grid.ts.length);
    const sample = sampleWindAtLatLng(grid, latlng.lat, latlng.lng, timeIndex);

    if (!sample || sample.u == null || sample.v == null) {
        return (
            <Box p={2}>
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

    return (
        <Box sx={{ p: 2, width: 260, background: "rgba(255,255,255,0.95)", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            <Typography variant="h6" fontWeight={700} mb={1}>Wind (Open-Meteo)</Typography>
            <Typography variant="body2"><strong>Speed:</strong> {speed.toFixed(1)} m/s ({speedKnots.toFixed(1)} kt)</Typography>
            <Typography variant="body2"><strong>Direction:</strong> {direction} ({meteoAngle.toFixed(0)}°)</Typography>
            <Typography variant="body2"><strong>Lat/Lon:</strong> {latlng.lat.toFixed(3)}, {latlng.lng.toFixed(3)}</Typography>
            <Typography variant="body2"><strong>Time:</strong> {new Date(grid.ts[timeIndex]).toLocaleString()}</Typography>
        </Box>
    );
}

export function WindInfoBox({ windData, selectedTime, minTime, maxTime, position = "topleft" }) {
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

    // Create control
    useEffect(() => {
        if (!map || !windData) return;

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
                    Promise.resolve().then(() => {
                        try {
                            rootRef.current.unmount();
                        } catch (err) {
                            console.warn("WindInfoBox unmount warning:", err);
                        }
                    });
                    rootRef.current = null;
                }
            }
        });

        const c = new Control({ position });
        c.addTo(map);
        controlRef.current = c;
        return () => c.remove();
    }, [map, windData, position]);

    // Update content
    useEffect(() => {
        if (!rootRef.current) return;
        rootRef.current.render(
            visible ? <WindInfoBoxContent grid={windData} selectedTime={selectedTime} minTime={minTime} maxTime={maxTime} latlng={latlng} /> : null
        );
    }, [latlng, selectedTime, windData, visible, minTime, maxTime]);

    return null;
}