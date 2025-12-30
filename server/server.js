// server.js
require("module-alias/register");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

// Route index
const apiRoutes = require("@routes");

const app = express();

// -----------------------------
// Middleware
// -----------------------------
app.use(express.json());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (
            origin.startsWith("http://localhost:3000") ||
            origin.startsWith("http://192.168.")
        ) {
            return callback(null, true);
        }

        callback(new Error("Not allowed by CORS"));
    }
}));

// -----------------------------
// Static files (downloads)
// -----------------------------
app.use("/downloads", express.static(path.join(__dirname, "uploads")));

// -----------------------------
// API routes
// -----------------------------
app.use("/api", apiRoutes);

// -----------------------------
// Start server
// -----------------------------
app.listen(3001, "0.0.0.0", () => {
    console.log("✅ Backend listening on http://0.0.0.0:3001");
});
