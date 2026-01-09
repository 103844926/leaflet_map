// server/routes/index.js
const express = require("express");

const windGridRoutes = require("./windGrid.route");
const transcodeRoutes = require("./transcode.route");
const mockShipsRoutes = require("./mockShips.route")

const router = express.Router();

// mount sub-routes
router.use(windGridRoutes);
router.use(transcodeRoutes);
router.use(mockShipsRoutes);

module.exports = router; // ✅ MUST export router
