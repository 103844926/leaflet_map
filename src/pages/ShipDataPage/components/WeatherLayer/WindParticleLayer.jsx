import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-velocity";
import { isValidWindData, calculateTimeIndex, isValidTimeRange, velocityOptionsForZoom } from "@/utils";

function getVelocityLayerConfig(zoom) {
    return {
        ...velocityOptionsForZoom(zoom),
        particleAge: 60,
        maxVelocity: 20,
        minVelocity: 0,
        opacity: 0.4,
        displayValues: false,
        pane: "overlayPane",
        colorScale: [
            "rgba(255, 255, 255, 0.6)",
        ],
    };
}

export function WindParticleLayer({
    windData,
    selectedTime,
    minTime,
    maxTime,
    visible = true,
}) {
    const map = useMap();
    const layerRef = useRef(null);
    const readyRef = useRef(false);
    const isUpdatingRef = useRef(false);
    const debounceTimerRef = useRef(null);
    const lastTimeIndexRef = useRef(null);
    const lastVelocityDataRef = useRef(null);
    const lastZoomRef = useRef(null);

    function buildVelocityData(windData, tIndex) {
        if (!windData) return null;

        const { ts, nx, ny, lo1, la1, lo2, la2, u, v } = windData;
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

    // Create layer ONCE (with zoom-aware options)
    useEffect(() => {
        if (!map || layerRef.current) return;

        const zoom = map.getZoom();
        lastZoomRef.current = zoom;

        const layer = L.velocityLayer(getVelocityLayerConfig(zoom));

        // Only add to map when visible
        if (visible) {
            layer.addTo(map);
        }
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
    }, [map, visible]);

    // Update wind data (debounced, time-based) - same as original
    useEffect(() => {
        if (
            !readyRef.current ||
            !layerRef.current ||
            !isValidWindData(windData) ||
            !isValidTimeRange(minTime, maxTime, selectedTime)
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

    // Handle visibility changes
    useEffect(() => {
        if (!map || !layerRef.current) return;

        if (visible) {
            if (!map.hasLayer(layerRef.current)) {
                layerRef.current.addTo(map);
            }
        } else {
            if (map.hasLayer(layerRef.current)) {
                map.removeLayer(layerRef.current);
            }
        }
    }, [visible, map]);

    // Recreate layer on zoom change (performance-safe) - same as original
    useEffect(() => {
        if (!map) return;

        const onZoomEnd = () => {
            const zoom = map.getZoom();
            if (zoom === lastZoomRef.current) return;
            lastZoomRef.current = zoom;

            if (!layerRef.current) return;

            const data = lastVelocityDataRef.current;

            map.removeLayer(layerRef.current);

            const newLayer = L.velocityLayer(getVelocityLayerConfig(zoom));

            if (data) newLayer.setData(data);

            if (visible) {
                newLayer.addTo(map);
            }
            layerRef.current = newLayer;
        };

        map.on("zoomend", onZoomEnd);
        return () => map.off("zoomend", onZoomEnd);
    }, [map, visible]);

    return null;
}