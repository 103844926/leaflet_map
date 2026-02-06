// routes/transcode.routes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { startTranscode, getProgress } = require("@services");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/transcode", upload.single("video"), async (req, res) => {
    try {
        const jobId = startTranscode(req.file.path);
        res.json({ jobId });
    } catch (err) {
        console.error("❌ Transcode error:", err);
        res.status(500).json({ error: "Transcode failed" });
    }
});

router.get("/transcode/progress/:id", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const interval = setInterval(() => {
        const state = getProgress(req.params.id);
        if (!state) return;

        res.write(`data: ${JSON.stringify(state)}\n\n`);

        if (state.done) {
            clearInterval(interval);
            res.end();
        }
    }, 500);
});

// Debug route to check if file exists
router.get("/debug/check/:filename", (req, res) => {
    const uploadsDir = path.join(__dirname, "..", "uploads");
    const filePath = path.join(uploadsDir, req.params.filename);

    console.log("🔍 Debug check:");
    console.log("  Looking for:", filePath);
    console.log("  Exists:", fs.existsSync(filePath));

    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        res.json({
            exists: true,
            path: filePath,
            size: stats.size
        });
    } else {
        // List what's actually in the directory
        const files = fs.readdirSync(uploadsDir);
        res.json({
            exists: false,
            path: filePath,
            filesInDirectory: files
        });
    }
});

module.exports = router;