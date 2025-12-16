import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-velocity";
import { calculateTimeIndex, createWindClickHandler } from "@/utils";

export function WindVelocityLayer({
    windData,
    selectedTime,
    minTime,
    maxTime,
    options = {},
}) {
    const map = useMap();

    const layerRef = useRef(null);
    const mountedRef = useRef(false);
    const readyRef = useRef(false);
    const isUpdatingRef = useRef(false);

    // --------------------------------------------------
    // Safely convert grid → velocity format
    // --------------------------------------------------
    function buildVelocityData(grid, tIndex) {
        if (!grid) return null;

        const { ts, nx, ny, lo1, la1, lo2, la2, u, v } = grid;

        if (
            !Array.isArray(ts) ||
            !Array.isArray(u) ||
            !Array.isArray(v) ||
            !u[tIndex] ||
            !v[tIndex]
        ) {
            return null;
        }

        const expectedSize = nx * ny;
        if (
            u[tIndex].length !== expectedSize ||
            v[tIndex].length !== expectedSize
        ) {
            console.warn("Wind grid size mismatch");
            return null;
        }

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
    // Create layer ONCE, after map is ready
    // --------------------------------------------------
    useEffect(() => {
        if (!map || layerRef.current || !windData) return;

        mountedRef.current = true;

        const initLayer = () => {
            if (!mountedRef.current) return;

            if (!map.getContainer()) {
                console.warn("Map container not available");
                return;
            }

            try {
                // Calculate initial time index
                const initialIdx = calculateTimeIndex(
                    selectedTime,
                    minTime,
                    maxTime,
                    windData.ts.length
                );

                // Build initial data
                const initialData = buildVelocityData(windData, initialIdx);

                layerRef.current = L.velocityLayer({
                    displayValues: true,
                    displayOptions: {
                        velocityType: "Wind",
                        position: "bottomleft",
                        emptyString: "No wind data",
                        angleConvention: "bearingCW",
                        speedUnit: "m/s",
                        directionString: "Direction"
                    },
                    lineWidth: 2,
                    particleMultiplier: 1 / 300,
                    particleAge: 90,
                    velocityScale: 1 / 50,
                    frameRate: 15,
                    maxVelocity: 20,
                    minVelocity: 0,
                    colorScale: [
                        "rgb(100,180,220)",
                        "rgb(120,220,200)",
                        "rgb(160,230,140)",
                        "rgb(255,255,100)",
                        "rgb(255,200,80)",
                        "rgb(255,100,50)",
                    ],
                    pane: "overlayPane",
                    ...options,
                    data: initialData, // Set initial data instead of null
                });

                layerRef.current.addTo(map);
                readyRef.current = true;
                console.log("Wind velocity layer created successfully with initial data");
            } catch (err) {
                console.error("Failed to create velocity layer:", err);
                layerRef.current = null;
                readyRef.current = false;
            }
        };

        map.whenReady(() => {
            setTimeout(initLayer, 100);
        });

        return () => {
            mountedRef.current = false;
            readyRef.current = false;
            isUpdatingRef.current = false;

            if (layerRef.current) {
                try {
                    if (map && map.hasLayer(layerRef.current)) {
                        map.removeLayer(layerRef.current);
                    }
                } catch (err) {
                    console.warn("Error removing velocity layer:", err);
                }
                layerRef.current = null;
            }
        };
    }, [map, windData]);

    // --------------------------------------------------
    // Listen for map clicks to log wind data
    // --------------------------------------------------
    useEffect(() => {
        if (!map || !windData) return;

        const onClick = createWindClickHandler(
            windData,
            selectedTime,
            minTime,
            maxTime,
            "WIND VELOCITY LAYER"
        );

        map.on("click", onClick);
        return () => map.off("click", onClick);
    }, [map, windData, selectedTime, minTime, maxTime]);

    // --------------------------------------------------
    // Update frame (STRICTLY guarded with debouncing)
    // --------------------------------------------------
    useEffect(() => {
        if (
            !mountedRef.current ||
            !readyRef.current ||
            !layerRef.current ||
            !windData ||
            !windData.ts ||
            isUpdatingRef.current
        ) {
            return;
        }

        if (!map || !map.getContainer()) {
            console.warn("Map not available for wind update");
            return;
        }

        const idx = calculateTimeIndex(
            selectedTime,
            minTime,
            maxTime,
            windData.ts.length
        );

        const velocityData = buildVelocityData(windData, idx);
        if (!velocityData) return;

        isUpdatingRef.current = true;

        requestAnimationFrame(() => {
            if (
                !mountedRef.current ||
                !layerRef.current ||
                !map ||
                !map.getContainer()
            ) {
                isUpdatingRef.current = false;
                return;
            }

            try {
                layerRef.current.setData(velocityData);
            } catch (err) {
                console.error("Velocity update failed:", err);
            } finally {
                setTimeout(() => {
                    isUpdatingRef.current = false;
                }, 50);
            }
        });
    }, [windData, selectedTime, minTime, maxTime, map]);

    return null;
}