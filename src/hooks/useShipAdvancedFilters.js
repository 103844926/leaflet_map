import { useMemo } from "react";

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

function getCountryLabel(code) {
    if (!code || code === "UNKNOWN") return "Unknown";
    try {
        return COUNTRY_NAMES.of(code) || code;
    } catch {
        return code;
    }
}

export function useShipAdvancedFilters(ships, appliedSearch, appliedFilters) {
    // Pure filtering logic - no state management
    const filteredShips = useMemo(() => {
        return ships.filter((ship) => {
            /* ---- Text search ---- */
            if (appliedSearch.trim()) {
                const q = appliedSearch.toLowerCase();

                const match =
                    String(ship.name || "").toLowerCase().includes(q) ||
                    String(ship.ship_type || "").toLowerCase().includes(q) ||
                    String(ship.country_code || "").toLowerCase().includes(q) ||
                    getCountryLabel(ship.country_code).toLowerCase().includes(q) ||
                    String(ship.status || "").toLowerCase().includes(q) ||
                    String(ship.speed || "").includes(q);

                if (!match) return false;
            }

            /* ---- Length ---- */
            if (appliedFilters.lengthMin && ship.length < +appliedFilters.lengthMin) return false;
            if (appliedFilters.lengthMax && ship.length > +appliedFilters.lengthMax) return false;

            /* ---- Width ---- */
            if (appliedFilters.widthMin && ship.width < +appliedFilters.widthMin) return false;
            if (appliedFilters.widthMax && ship.width > +appliedFilters.widthMax) return false;

            /* ---- Type ---- */
            if (appliedFilters.type && ship.ship_type !== appliedFilters.type) return false;

            /* ---- Status ---- */
            if (appliedFilters.status && ship.status !== appliedFilters.status) return false;

            return true;
        });
    }, [ships, appliedSearch, appliedFilters]);

    return filteredShips;
}