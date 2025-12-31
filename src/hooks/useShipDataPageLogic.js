import { useState, useEffect, useMemo, useRef, } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { getShipData, getCurrentShipData, getWindyData } from "@/datas";
import { useShipVisible } from "./useShipVisible";
import { detectShipMovementStartsDetailed } from "@/utils";

export function useShipDataPageLogic() {
    const [ships, setShips] = useState([]);
    const [currentShips, setCurrentShips] = useState([]);
    const [initialCenter, setInitialCenter] = useState(null);
    const [timeRange, setTimeRange] = useState(null);
    const [windData, setWindData] = useState(null);
    const [virtualMinTime, setVirtualMinTime] = useState(null);
    const [virtualMaxTime, setVirtualMaxTime] = useState(null);
    const isAnimatingRef = useRef(false);

    // UI breakpoint
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // Ship visibility logic stays the same
    const {
        visibleShips,
        handleShipToggle,
    } = useShipVisible(ships, currentShips);

    // --------------------------
    // Load Ships + Current Ships + Compute Center
    // --------------------------
    useEffect(() => {
        const load = async (forceRefresh = false) => {
            if (isAnimatingRef.current && forceRefresh) return;

            const [historicalData, currentData] = await Promise.all([
                getShipData(forceRefresh),
                getCurrentShipData(forceRefresh)
            ]);

            setShips(historicalData);
            setCurrentShips(currentData);

            // ONLY use historical ships for initial center
            if (!initialCenter && historicalData.length) {
                const allLats = historicalData.flatMap((s) => s.locations.map((l) => l.lat));
                const allLongs = historicalData.flatMap((s) => s.locations.map((l) => l.long));

                setInitialCenter([
                    allLats.reduce((a, b) => a + b, 0) / allLats.length,
                    allLongs.reduce((a, b) => a + b, 0) / allLongs.length,
                ]);
            }
        };

        load();

        const interval = setInterval(() => load(true), 30000);
        return () => clearInterval(interval);
    }, [initialCenter]);

    // --------------------------
    // Filter ships based on time
    // --------------------------
    const filteredShips = useMemo(() => {
        if (!timeRange) return ships;
        const current = timeRange[1];
        return ships.map((ship, i) => {
            const filtered = ship.locations.filter((loc) => loc.time <= current);

            return {
                ...ship,
                index: i,                        // permanent original index
                locations: filtered.length ? filtered : [ship.locations[0]],
            };
        });

    }, [ships, timeRange]);

    // --------------------
    // Detect movement starts
    // --------------------
    const movementMarks = useMemo(() => {
        if (!ships || ships.length === 0) return new Map();

        const shipsToAnalyze = visibleShips
            ? ships.filter((_, idx) => visibleShips[idx])
            : ships;

        return detectShipMovementStartsDetailed(shipsToAnalyze, 50);
    }, [ships, visibleShips]);

    // --------------------
    // Get Windy Data
    // --------------------

    useEffect(() => {
        if (!initialCenter) return;
        const [lat, lon] = initialCenter;

        getWindyData({ lat, lon, model: "gfs" })
            .then((data) => {
                setWindData(data);
                console.log("Windy data:", data);
                // optionally store in state for visualization
            })
            .catch(console.error);
    }, [initialCenter]);

    // --------------------
    // Sync ship time range with wind data time range
    // --------------------

    useEffect(() => {
        if (!ships.length || !windData) return;

        const shipMin = Math.min(...ships.flatMap(s => s.locations.map(l => l.time)));
        const shipMax = Math.max(...ships.flatMap(s => s.locations.map(l => l.time)));

        // virtual timeline is the SHIP timeline
        setVirtualMinTime(shipMin);
        setVirtualMaxTime(shipMax);
    }, [ships, windData]);

    return {
        ships,
        currentShips,
        initialCenter,
        timeRange,
        setTimeRange,
        visibleShips,
        handleShipToggle,
        filteredShips,
        isAnimatingRef,
        movementMarks,
        windData,
        virtualMinTime,
        virtualMaxTime,
        isMobile,
    };
}