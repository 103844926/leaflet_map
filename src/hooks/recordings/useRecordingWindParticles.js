// useRecordingWindParticles.js - Capture wind particles for recording
import { useCallback } from "react";

export function useRecordingWindParticles() {
    const capture = useCallback((map, ctx, outW, outH, scale = 1) => {
        // Get wind particles map
        const app = map?._windParticleExportApp;
        if (!app || !app.renderer?.view) return true;

        const system = map?._windParticleExportSystem;
        if (!system) return true;

        const canvas = app.renderer.view;

        // Compute bounding rects to place wind particles correctly
        const mapRect = map.getContainer().getBoundingClientRect();
        const rect = canvas.getBoundingClientRect();

        const dx = Math.round((rect.left - mapRect.left) * scale);
        const dy = Math.round((rect.top - mapRect.top) * scale);
        const dw = Math.round(rect.width * scale);
        const dh = Math.round(rect.height * scale);

        try {
            // fixed timestep for export (equal to fps inside recording capture)
            const dt = 1 / 24;

            // Time advances
            system.step(dt);

            // Render particles to canvas
            system.render();
            app.renderer.render(app.stage);
            app.renderer.gl?.flush?.();
            ctx.drawImage(canvas, dx, dy, dw, dh);
        } catch (e) {
            console.warn("Wind particle capture failed", e);
            return false;
        }

        return true;
    }, []);

    return { capture };
}
