import { useState, useEffect, useMemo, useRef } from "react";
import { getShipData, getCurrentShipData } from "@/datas";
import { useShipVisible } from "./useShipVisible";
import { detectShipMovementStartsDetailed } from "@/utils";

export function useShipDataPageLogic() {
    const [ships, setShips] = useState([]);
    const [currentShips, setCurrentShips] = useState([]);
    const [initialCenter, setInitialCenter] = useState(null);
    const [timeRange, setTimeRange] = useState(null);

    const isAnimatingRef = useRef(false);

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
                index: i,                        // <-- THIS LINE: permanent original index
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
    };
}
