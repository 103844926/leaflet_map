/**
 * Calculate time index from selected time and range
 */
export function calculateTimeIndex(selectedTime, minTime, maxTime, totalTimeSteps) {
    if (!selectedTime || !minTime || !maxTime || !totalTimeSteps) {
        return 0;
    }

    const p = (selectedTime - minTime) / (maxTime - minTime);
    return Math.max(0, Math.min(totalTimeSteps - 1, Math.floor(p * totalTimeSteps)));
}

/**
 * Sample wind data at a specific latitude/longitude
 */
export function sampleWindAtLatLng(grid, lat, lng, timeIndex) {
    if (!grid) return null;

    const { nx, ny, lo1, la1, lo2, la2, u, v, gust } = grid;

    const dx = (lo2 - lo1) / (nx - 1);
    const dy = (la1 - la2) / (ny - 1);

    const ix = Math.round((lng - lo1) / dx);
    const iy = Math.round((la1 - lat) / dy);

    if (ix < 0 || ix >= nx || iy < 0 || iy >= ny) return null;

    const idx = iy * nx + ix;

    return {
        u: u?.[timeIndex]?.[idx],
        v: v?.[timeIndex]?.[idx],
        gust: gust?.[timeIndex]?.[idx] ?? null,
        gridIndex: idx,
    };
}

/**
 * Calculate wind speed and direction from U/V components
 */
export function calculateWindMetrics(u, v) {
    const speed = Math.sqrt(u * u + v * v);
    const speedKnots = speed * 1.94384;

    const rawAngle = Math.atan2(u, v) * (180 / Math.PI);
    const meteoAngle = (rawAngle + 360) % 360;

    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const direction = dirs[Math.round(meteoAngle / 45) % 8];

    return {
        speed,
        speedKnots,
        meteoAngle,
        direction,
    };
}

/**
 * Log wind data to console (shared formatting)
 */
export function logWindData(label, { lat, lng, u, v, gust, gridIndex, timeIndex, selectedTime, gridTime }) {
    const { speed, speedKnots, meteoAngle, direction } = calculateWindMetrics(u, v);

    console.log(`=== ${label} ===`);
    console.log(`Location: ${lat.toFixed(3)}, ${lng.toFixed(3)}`);
    console.log(`U: ${u.toFixed(2)} m/s`);
    console.log(`V: ${v.toFixed(2)} m/s`);
    console.log(`Speed: ${speed.toFixed(2)} m/s (${speedKnots.toFixed(1)} kt)`);
    console.log(`Direction: ${direction} (${meteoAngle.toFixed(0)}°)`);
    console.log(`Grid Index: ${gridIndex}`);
    console.log(`Time Index: ${timeIndex}`);

    if (selectedTime) {
        console.log(`Selected Time: ${new Date(selectedTime).toISOString()}`);
    }
    if (gridTime) {
        console.log(`Grid Time: ${new Date(gridTime).toISOString()}`);
    }
}

/**
 * Create map click handler for wind sampling
 */
export function createWindClickHandler(windData, selectedTime, minTime, maxTime, label = "WIND DATA") {
    return (e) => {
        const { lat, lng } = e.latlng;

        const timeIndex = calculateTimeIndex(
            selectedTime,
            minTime,
            maxTime,
            windData.ts.length
        );

        const sample = sampleWindAtLatLng(windData, lat, lng, timeIndex);

        if (sample && sample.u != null && sample.v != null) {
            logWindData(label, {
                lat,
                lng,
                u: sample.u,
                v: sample.v,
                gust: sample.gust,
                gridIndex: sample.gridIndex,
                timeIndex,
                selectedTime,
                gridTime: windData.ts[timeIndex],
            });
        } else {
            console.log(`=== ${label} ===`);
            console.log("No wind data at this location");
        }
    };
}

export function velocityOptionsForZoom(zoom) {
    if (zoom <= 4) {
        return {
            particleMultiplier: 1 / 1200,
            lineWidth: 0.6,
            velocityScale: 1 / 120,
            frameRate: 8,
        };
    }

    if (zoom <= 6) {
        return {
            particleMultiplier: 1 / 800,
            lineWidth: 0.9,
            velocityScale: 1 / 90,
            frameRate: 10,
        };
    }

    if (zoom <= 8) {
        return {
            particleMultiplier: 1 / 500,
            lineWidth: 1.2,
            velocityScale: 1 / 65,
            frameRate: 12,
        };
    }

    return {
        particleMultiplier: 1 / 300,
        lineWidth: 1.5,
        velocityScale: 1 / 50,
        frameRate: 15,
    };
}
