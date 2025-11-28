import { useState, useCallback } from "react";

export function useRecordingVideoProcessor() {
    const [isProcessing, setIsProcessing] = useState(false);

    const processFramesToVideo = useCallback(async (frames, recordingSpeed) => {
        if (!frames.length) {
            alert("No frames captured");
            return;
        }

        setIsProcessing(true);

        try {
            const canvas = document.createElement("canvas");
            const img = new Image();
            img.src = frames[0];
            await new Promise((res) => (img.onload = res));
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");

            const stream = canvas.captureStream(20);
            const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
            const chunks = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: "video/webm" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `ship-recording-${Date.now()}.webm`;
                a.click();
                setIsProcessing(false);
            };

            recorder.start();
            for (let url of frames) {
                const img = new Image();
                img.src = url;
                await new Promise((res) => (img.onload = res));
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                await new Promise((res) => setTimeout(res, (1000 / 30) / recordingSpeed));
            }
            recorder.stop();
        } catch (err) {
            console.error("Recording processing failed:", err);
            alert("Failed to process recording");
            setIsProcessing(false);
        }
    }, []);

    return {
        isProcessing,
        processFramesToVideo
    };
}