import { useMemo } from "react";

const UNKNOWN_VALUES = new Set(["--", "UNKNOWN", "UNK", "??", ""]);

export function useShipFilterOptions(ships) {
    return useMemo(() => {
        const countrySet = new Set();
        const shipTypeSet = new Set();
        let maxSpeed = 0;
        let maxLength = 0;

        ships.forEach((s) => {
            // --- Country ---
            if (s.country_code) {
                const raw = String(s.country_code).trim().toUpperCase();

                if (raw.length === 2) {
                    countrySet.add(raw);
                } else if (UNKNOWN_VALUES.has(raw)) {
                    countrySet.add("UNKNOWN");
                }
            }

            // --- Ship Type ---
            if (typeof s.ship_type === "number") {
                shipTypeSet.add(s.ship_type);
            }

            // --- Speed ---
            if (typeof s.speed === "number") {
                maxSpeed = Math.max(maxSpeed, s.speed);
            }

            // --- Length ---
            if (typeof s.length === "number") {
                maxLength = Math.max(maxLength, s.length);
            }
        });

        return {
            countryCodes: {
                key: "countryCodes",
                values: [...countrySet].sort(),
            },
            shipType: {
                key: "shipTypes",
                values: [...shipTypeSet].sort((a, b) => a - b),
            },
            maxSpeed: Math.floor(maxSpeed),
            maxLength: Math.floor(maxLength),
        };
    }, [ships]);
}
