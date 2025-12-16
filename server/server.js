// server.js
require("dotenv").config();
const getWindGrid = require("./windGrid");
const express = require("express");
const fetch = require("node-fetch"); // Node <18
const cors = require("cors");

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

let cachedWind = null;
let cachedAt = 0;

app.post("/api/wind", async (req, res) => {
    try {
        const { lat, lon } = req.body;
        if (!lat || !lon) {
            return res.status(400).json({ error: "lat and lon required" });
        }

        // Cache for 1 hour
        const now = Date.now();
        if (cachedWind && now - cachedAt < 60 * 60 * 1000) {
            return res.json(cachedWind);
        }

        const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${lat}` +
            `&longitude=${lon}` +
            `&hourly=wind_speed_10m,wind_direction_10m` +
            `&wind_speed_unit=ms` +
            `&forecast_days=3` +
            `&timezone=UTC`;

        const response = await fetch(url);
        const raw = await response.json();

        const { time, wind_speed_10m, wind_direction_10m } = raw.hourly;

        // Convert speed+direction → u/v
        const u = [];
        const v = [];

        for (let i = 0; i < wind_speed_10m.length; i++) {
            const speed = wind_speed_10m[i];
            const dir = wind_direction_10m[i] * Math.PI / 180;

            // meteorological convention (direction wind comes FROM)
            u.push(-speed * Math.sin(dir));
            v.push(-speed * Math.cos(dir));
        }

        const payload = {
            ts: time.map(t => new Date(t).getTime()),
            "wind_u-surface": u,
            "wind_v-surface": v,
        };

        cachedWind = payload;
        cachedAt = now;

        res.json(payload);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch Open-Meteo" });
    }
});

app.post("/api/wind-grid", async (req, res) => {
    try {
        const { lat, lon } = req.body;
        if (!lat || !lon) {
            return res.status(400).json({ error: "lat and lon required" });
        }

        const grid = await getWindGrid(lat, lon);
        res.json(grid);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch wind grid" });
    }
});


app.listen(3001, () =>
    console.log("Open-Meteo wind proxy running on port 3001")
);
