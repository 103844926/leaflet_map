import { useEffect, useRef, useState } from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

/**
 * Mobile-only transcode progress overlay
 * Uses SSE to wait for FFmpeg to fully finish
 */
export function TranscodeProgress({ jobId, onDone }) {
    const [progress, setProgress] = useState(0);
    const [done, setDone] = useState(false);
    const eventSourceRef = useRef(null);

    useEffect(() => {
        if (!jobId) return;

        const source = new EventSource(`/transcode/progress/${jobId}`);
        eventSourceRef.current = source;

        source.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (typeof data.progress === "number") {
                setProgress(data.progress);
            }

            if (data.done) {
                setDone(true);
                source.close();

                // Small delay for UX smoothness
                setTimeout(() => {
                    if (onDone && data.mp4Url) {
                        onDone(data.mp4Url);
                    } else if (data.mp4Url) {
                        window.location.href = data.mp4Url;
                    }
                }, 300);
            }
        };

        source.onerror = () => {
            console.warn("⚠️ Transcode SSE disconnected");
            source.close();
        };

        return () => {
            source.close();
        };
    }, [jobId, onDone]);

    if (!jobId) return null;

    return (
        <Box
            sx={{
                position: "fixed",
                inset: 0,
                zIndex: 2000,
                backgroundColor: "rgba(0,0,0,0.65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "auto",
            }}
        >
            <Box
                sx={{
                    width: "85%",
                    maxWidth: 360,
                    backgroundColor: "#111",
                    borderRadius: 2,
                    p: 3,
                    textAlign: "center",
                }}
            >
                <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                    Processing video
                </Typography>

                <Typography variant="body2" sx={{ color: "#bbb", mb: 2 }}>
                    Please keep this page open
                </Typography>

                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 8, borderRadius: 4 }}
                />

                <Typography
                    variant="body2"
                    sx={{ color: "#fff", mt: 1 }}
                >
                    {progress}%
                </Typography>
            </Box>
        </Box>
    );
}
