import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-velocity";
import { calculateTimeIndex } from "@/utils";

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

    // --------------------------------------------------
    // Safely convert grid → velocity format
    // --------------------------------------------------
    function buildVelocityData(grid, tIndex) {
        if (!grid) return null;

        const { ts, nx, ny, lo1, la1, lo2, la2, u, v } = grid;
        if (!u?.[tIndex] || !v?.[tIndex]) return null;

        const dx = (lo2 - lo1) / (nx - 1);  // longitude step
        const dy = (la1 - la2) / (ny - 1);  // latitude step
        const refTime = new Date(ts[tIndex]).toISOString();

        return [
            {
                header: {
                    nx, ny, lo1, la1, lo2, la2, dx, dy, refTime,
                    parameterCategory: 2,   // Wind
                    parameterNumber: 2,     // U-component
                },
                data: u[tIndex],
            },
            {
                header: {
                    nx, ny, lo1, la1, lo2, la2, dx, dy, refTime,
                    parameterCategory: 2,   // Wind
                    parameterNumber: 3,     // V-component
                },
                data: v[tIndex],
            },
        ];
    }

    // --------------------------------------------------
    // Create layer ONCE, after map is ready
    // --------------------------------------------------
    useEffect(() => {
        if (!map || layerRef.current) return;

        const layer = L.velocityLayer({
            displayValues: false,
            lineWidth: 2,
            particleMultiplier: 1 / 350,
            particleAge: 60,
            velocityScale: 1 / 55,
            frameRate: 12,
            maxVelocity: 20,
            minVelocity: 0,
            pane: "overlayPane",
        });

        layer.addTo(map);
        layerRef.current = layer;
        readyRef.current = true;

        return () => {
            readyRef.current = false;
            if (map.hasLayer(layer)) map.removeLayer(layer);
            layerRef.current = null;
        };
    }, [map]);

    // --------------------------------------------------
    // Update data (Initially and on time changes)
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

        if (isUpdatingRef.current) return;

        const idx = calculateTimeIndex(
            selectedTime,
            minTime,
            maxTime,
            windData.ts.length
        );

        const data = buildVelocityData(windData, idx);
        if (!data) return;

        isUpdatingRef.current = true;

        requestAnimationFrame(() => {
            if (layerRef.current) {
                layerRef.current.setData(data);
            }
            isUpdatingRef.current = false;
        });
    }, [windData, selectedTime, minTime, maxTime]);

    return null;
}
