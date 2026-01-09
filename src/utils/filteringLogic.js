export const defaultShipFilters = {
    shipTypes: [],        // [] = all
    countryCodes: [],   // [] = all
    minSpeed: 0,
    minLength: 0,
    onlyMoving: false,
    onlyViolations: false,
};

export function applyShipFilters(ship, filters) {
    if (filters.shipTypes.length && !filters.shipTypes.includes(ship.ship_type)) {
        return false;
    }

    if (filters.countryCodes.length) {
        const shipCode = ship.country_code
            ? String(ship.country_code).toUpperCase()
            : "UNKNOWN";

        if (
            filters.countryCodes.includes("UNKNOWN") &&
            shipCode.length === 2
        ) {
            return false;
        }

        if (
            !filters.countryCodes.includes("UNKNOWN") &&
            shipCode === "UNKNOWN"
        ) {
            return false;
        }

        if (
            shipCode.length === 2 &&
            !filters.countryCodes.includes(shipCode)
        ) {
            return false;
        }
    }

    if (filters.onlyMoving && ship.speed <= 0.5) {
        return false;
    }

    if (filters.onlyViolations && !ship.violation_f) {
        return false;
    }

    if (ship.speed < filters.minSpeed) {
        return false;
    }

    if (ship.length < filters.minLength) {
        return false;
    }

    return true;
}