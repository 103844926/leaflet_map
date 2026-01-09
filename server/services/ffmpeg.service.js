// services/ffmpeg.service.js
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const progressMap = new Map();

// Define uploads directory with absolute path
const uploadsDir = path.join(__dirname, "..", "uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("📁 Created uploads directory:", uploadsDir);
}

console.log("📁 Uploads directory:", uploadsDir);

function startTranscode(inputPath) {
    const jobId = Date.now().toString();
    const outputPath = path.join(uploadsDir, `${jobId}.mp4`);

    console.log("🎬 Starting transcode:");
    console.log("  Input:", inputPath);
    console.log("  Output:", outputPath);
    console.log("  JobId:", jobId);

    progressMap.set(jobId, { progress: 0 });

    const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-i", inputPath,
        "-vf", "scale=ceil(iw/2)*2:ceil(ih/2)*2",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-progress", "pipe:1",
        outputPath
    ]);

    let durationMs = null;

    ffmpeg.stderr.on("data", (data) => {
        const match = data.toString().match(
            /Duration: (\d+):(\d+):(\d+)\.(\d+)/
        );
        if (match) {
            const [, h, m, s, ms] = match.map(Number);
            durationMs = ((h * 3600 + m * 60 + s) * 1000) + ms;
        }
    });

    ffmpeg.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
            if (line.startsWith("out_time_ms=") && durationMs) {
                const outMs = Number(line.split("=")[1]);
                const percent = Math.min(100, Math.floor(outMs / durationMs * 100));
                progressMap.set(jobId, { progress: percent });
            }
        }
    });

    ffmpeg.on("close", (code) => {
        console.log(`✅ FFmpeg finished with code ${code}`);
        console.log(`  Checking if file exists: ${outputPath}`);
        console.log(`  File exists: ${fs.existsSync(outputPath)}`);

        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            console.log(`  File size: ${stats.size} bytes`);
        }

        progressMap.set(jobId, {
            progress: 100,
            done: true,
            mp4Url: `/downloads/${jobId}.mp4`
        });
        fs.unlink(inputPath, () => { });
    });

    ffmpeg.on("error", (err) => {
        console.error("❌ FFmpeg error:", err);
    });

    return jobId;
}

function getProgress(jobId) {
    return progressMap.get(jobId);
}

module.exports = { startTranscode, getProgress };