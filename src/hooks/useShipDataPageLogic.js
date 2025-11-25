import { useState, useEffect, useMemo, useRef } from "react";
import { getShipData } from "@/datas";
import { useShipVisible } from "./useShipVisible";

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
        return ships.map((ship) => {
            const filtered = ship.locations.filter((loc) => loc.time <= current);
            return {
                ...ship,
                locations: filtered.length ? filtered : [ship.locations[0]],
            };
        });
    }, [ships, timeRange]);

    return {
        ships,
        initialCenter,
        timeRange,
        setTimeRange,
        visibleShips,
        handleShipToggle,
        filteredShips,
        isAnimatingRef,
    };
}
