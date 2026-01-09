const express = require("express");
const { getWindGrid } = require("@services"); // ✅ destructure

const router = express.Router();

router.post("/wind-grid", async (req, res) => {
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

module.exports = router;
