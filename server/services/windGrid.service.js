// server/services/windGrid.service.js
const fetch = require("node-fetch");

// ===== CONFIG =====
const GRID_NX = 10;
const GRID_NY = 12;
const GRID_SPAN_DEG = 4; // degrees (2° around center)
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

let cache = null;
let cacheTime = 0;

// Convert speed+direction → u/v
function speedDirToUV(speed, dirDeg) {
    const rad = (dirDeg * Math.PI) / 180;
    return {
        u: -speed * Math.sin(rad),
        v: -speed * Math.cos(rad),
    };
}

async function getWindGrid(lat, lon) {
    const now = Date.now();

    // Serve cache
    if (cache && now - cacheTime < CACHE_TTL) {
        return cache;
    }

    // Build grid bounds
    const half = GRID_SPAN_DEG / 2;
    const la1 = 22;
    const la2 = 8;
    const lo1 = 104;
    const lo2 = 110;

    const lats = [];
    const lons = [];

    for (let y = 0; y < GRID_NY; y++) {
        lats.push(la1 - (y * (la1 - la2)) / (GRID_NY - 1));
    }

    for (let x = 0; x < GRID_NX; x++) {
        lons.push(lo1 + (x * (lo2 - lo1)) / (GRID_NX - 1));
    }

    // Build all request URLs
    const requests = [];
    for (const latP of lats) {
        for (const lonP of lons) {
            const url =
                `https://api.open-meteo.com/v1/forecast` +
                `?latitude=${latP}` +
                `&longitude=${lonP}` +
                `&hourly=wind_speed_10m,wind_direction_10m` +
                `&wind_speed_unit=ms` +
                `&forecast_days=3` +
                `&timezone=UTC`;

            requests.push(() => fetch(url).then(r => r.json()));
        }
    }

    // Batch requests to avoid rate limiting
    const BATCH_SIZE = 10; // Adjust based on API limits
    const DELAY_MS = 200;  // Delay between batches
    const responses = [];

    console.log(`Fetching ${requests.length} grid points in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
        const batch = requests.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(fn => fn()));
        responses.push(...batchResults);

        // Add delay between batches (except for the last one)
        if (i + BATCH_SIZE < requests.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
    }

    // Use first response as time reference
    const time = responses[0].hourly.time.map(t => new Date(t).getTime());
    const timeCount = time.length;

    // Initialize grid arrays
    const u = Array.from({ length: timeCount }, () => []);
    const v = Array.from({ length: timeCount }, () => []);

    // Fill grids (row-major: y → x)
    responses.forEach((resp, idx) => {
        if (
            !resp ||
            !resp.hourly ||
            !resp.hourly.wind_speed_10m ||
            !resp.hourly.wind_direction_10m
        ) {
            console.warn(`Invalid response at index ${idx}`);
            console.warn("Response:", JSON.stringify(resp, null, 2));

            // Fill with zeros to keep grid shape intact
            for (let t = 0; t < timeCount; t++) {
                u[t][idx] = 0;
                v[t][idx] = 0;
            }
            return;
        }

        const speeds = resp.hourly.wind_speed_10m;
        const dirs = resp.hourly.wind_direction_10m;

        for (let t = 0; t < timeCount; t++) {
            const { u: uu, v: vv } = speedDirToUV(speeds[t], dirs[t]);
            u[t][idx] = uu;
            v[t][idx] = vv;
        }
    });


    const payload = {
        ts: time,
        nx: GRID_NX,
        ny: GRID_NY,
        lo1,
        la1,
        lo2,
        la2,
        u,
        v,
    };

    console.log("Grid built:", {
        nx: payload.nx,
        ny: payload.ny,
        u0: payload.u[0]?.length,
        v0: payload.v[0]?.length
    });


    cache = payload;
    cacheTime = now;

    return payload;
};

module.exports = { getWindGrid };