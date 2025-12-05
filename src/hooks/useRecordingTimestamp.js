// useRecordingTimestamp.js
import { useCallback } from "react";

export function useRecordingTimestamp() {
    const formatDateTime = (ts) =>
        ts
            ? new Date(ts).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            })
            : "No data";

    const drawTimestamp = useCallback((ctx, currentTime, outW, outH, scale = 1) => {
        const timestamp = formatDateTime(currentTime);
        ctx.save();


        // Position in bottom-left (matching your UI design)
        const padding = 16 * scale;
        const boxX = 32 * scale;
        const boxY = outH - 32 * scale;

        // Font setup
        const fontSize = Math.round(16 * scale);
        ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
        const textMetrics = ctx.measureText(timestamp);
        const textWidth = textMetrics.width;
        const textHeight = fontSize * 1.2;

        // Background box with rounded corners
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.beginPath();
        const radius = 8 * scale;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = textHeight + padding * 2;
        const x = boxX - padding;
        const y = boxY - textHeight - padding;

        // Draw rounded rectangle
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + boxWidth - radius, y);
        ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
        ctx.lineTo(x + boxWidth, y + boxHeight - radius);
        ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - radius, y + boxHeight);
        ctx.lineTo(x + radius, y + boxHeight);
        ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // Draw text
        ctx.fillStyle = "white";
        ctx.textBaseline = "top";
        ctx.fillText(timestamp, boxX, boxY - textHeight);

        ctx.restore();


    }, []);

    return { drawTimestamp };
}