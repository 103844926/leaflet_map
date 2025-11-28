import { useState, useEffect, useMemo, useRef } from "react";
import { getShipData } from "@/datas";
import { useShipVisible } from "./useShipVisible";
import { detectShipMovementStartsDetailed } from "@/utils";

export function useShipDataPageLogic() {
    const [ships, setShips] = useState([]);
    const [initialCenter, setInitialCenter] = useState(null);
    const [timeRange, setTimeRange] = useState(null);

    const isAnimatingRef = useRef(false);

    // Ship visibility logic stays the same
    const { visibleShips, handleShipToggle } = useShipVisible(ships);

    // --------------------------
    // Load Ships + Compute Center
    // --------------------------
    useEffect(() => {
        const load = async (forceRefresh = false) => {
            if (isAnimatingRef.current && forceRefresh) return;

            const data = await getShipData(forceRefresh);
            setShips(data);

            if (!initialCenter && data.length) {
                const allLats = data.flatMap((s) => s.locations.map((l) => l.lat));
                const allLongs = data.flatMap((s) => s.locations.map((l) => l.long));

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
        if (!ships || ships.length === 0) return [];
        // Only calculate for visible ships
        const shipsToAnalyze = visibleShips
            ? ships.filter((_, idx) => visibleShips[idx])
            : ships;
        return detectShipMovementStartsDetailed(shipsToAnalyze, 50); // 50m threshold
    }, [ships, visibleShips]);


    return {
        ships,
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
