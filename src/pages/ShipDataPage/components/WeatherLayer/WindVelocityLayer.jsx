import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-velocity";
import { calculateTimeIndex, velocityOptionsForZoom } from "@/utils";

export function WindVelocityLayer({
    windData,
    selectedTime,
    minTime,
    maxTime,
}) {
    const map = useMap();

    const layerRef = useRef(null);
    const readyRef = useRef(false);
    const isUpdatingRef = useRef(false);
    const debounceTimerRef = useRef(null);
    const lastTimeIndexRef = useRef(null);
    const lastVelocityDataRef = useRef(null);
    const lastZoomRef = useRef(null);

    // --------------------------------------------------
    // Convert grid → velocity format
    // --------------------------------------------------
    function buildVelocityData(grid, tIndex) {
        if (!grid) return null;

        const { ts, nx, ny, lo1, la1, lo2, la2, u, v } = grid;
        if (!u?.[tIndex] || !v?.[tIndex]) return null;

        const dx = (lo2 - lo1) / (nx - 1);
        const dy = (la1 - la2) / (ny - 1);
        const refTime = new Date(ts[tIndex]).toISOString();

        return [
            {
                header: {
                    nx, ny, lo1, la1, lo2, la2, dx, dy, refTime,
                    parameterCategory: 2,
                    parameterNumber: 2,
                },
                data: u[tIndex],
            },
            {
                header: {
                    nx, ny, lo1, la1, lo2, la2, dx, dy, refTime,
                    parameterCategory: 2,
                    parameterNumber: 3,
                },
                data: v[tIndex],
            },
        ];
    }

    // --------------------------------------------------
    // Create layer ONCE (with zoom-aware options)
    // --------------------------------------------------
    useEffect(() => {
        if (!map || layerRef.current) return;

        const zoom = map.getZoom();
        lastZoomRef.current = zoom;

        const layer = L.velocityLayer({
            ...velocityOptionsForZoom(zoom),
            particleAge: 60,
            maxVelocity: 20,
            minVelocity: 0,
            opacity: 0.9,
            displayValues: false,
            pane: "overlayPane",
        });

        layer.addTo(map);
        layerRef.current = layer;
        readyRef.current = true;

        return () => {
            readyRef.current = false;

            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            if (layerRef.current && map.hasLayer(layerRef.current)) {
                map.removeLayer(layerRef.current);
            }

            layerRef.current = null;
        };
    }, [map]);

    // --------------------------------------------------
    // Update wind data (debounced, time-based)
    // --------------------------------------------------
    useEffect(() => {
        if (
            !readyRef.current ||
            !layerRef.current ||
            !windData?.ts ||
            minTime == null ||
            maxTime == null ||
            selectedTime == null
        ) return;

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        const idx = calculateTimeIndex(
            selectedTime,
            minTime,
            maxTime,
            windData.ts.length
        );

        if (idx === lastTimeIndexRef.current) return;

        debounceTimerRef.current = setTimeout(() => {
            if (isUpdatingRef.current) return;

            const data = buildVelocityData(windData, idx);
            if (!data) return;

            isUpdatingRef.current = true;
            lastTimeIndexRef.current = idx;
            lastVelocityDataRef.current = data;

            requestAnimationFrame(() => {
                layerRef.current?.setData(data);
                isUpdatingRef.current = false;
            });
        }, 150);

    }, [windData, selectedTime, minTime, maxTime]);

    // --------------------------------------------------
    // Recreate layer on zoom change (performance-safe)
    // --------------------------------------------------
    useEffect(() => {
        if (!map) return;

        const onZoomEnd = () => {
            const zoom = map.getZoom();
            if (zoom === lastZoomRef.current) return;
            lastZoomRef.current = zoom;

            if (!layerRef.current) return;

            const data = lastVelocityDataRef.current;

            map.removeLayer(layerRef.current);

            const newLayer = L.velocityLayer({
                ...velocityOptionsForZoom(zoom),
                particleAge: 60,
                maxVelocity: 20,
                minVelocity: 0,
                displayValues: false,
                pane: "overlayPane",
            });

            if (data) newLayer.setData(data);

            newLayer.addTo(map);
            layerRef.current = newLayer;
        };

        map.on("zoomend", onZoomEnd);
        return () => map.off("zoomend", onZoomEnd);
    }, [map]);

    // --------------------------------------------------
    // Hide layer during movement (visual clarity)
    // --------------------------------------------------
    useEffect(() => {
        if (!map || !layerRef.current) return;

        const hide = () => {
            if (map.hasLayer(layerRef.current)) {
                map.removeLayer(layerRef.current);
            }
        };

        const show = () => {
            if (!map.hasLayer(layerRef.current)) {
                layerRef.current.addTo(map);
            }
        };

        map.on("movestart", hide);
        map.on("moveend", show);

        return () => {
            map.off("movestart", hide);
            map.off("moveend", show);
        };
    }, [map]);

    return null;
}
