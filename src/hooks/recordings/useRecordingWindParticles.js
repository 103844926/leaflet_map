import { useCallback } from "react";

export function useRecordingWindParticles() {
    const capture = useCallback((map, ctx, outW, outH, scale = 1) => {
        const app = map?._windParticleExportApp;
        if (!app || !app.renderer?.view) return true;

        const system = map?._windParticleExportSystem;
        if (!system) return true;

        const canvas = app.renderer.view;
        const mapRect = map.getContainer().getBoundingClientRect();
        const rect = canvas.getBoundingClientRect();

        const dx = Math.round((rect.left - mapRect.left) * scale);
        const dy = Math.round((rect.top - mapRect.top) * scale);
        const dw = Math.round(rect.width * scale);
        const dh = Math.round(rect.height * scale);

        try {
            // fixed timestep for export
            const dt = 1 / 24; // or pass fps

            system.step(dt);                            // Time advances
            system.render();                            // Draw particles
            app.renderer.render(app.stage);             // Render to canvas
            app.renderer.gl?.flush?.();                 // Ensure all GL commands are done
            ctx.drawImage(canvas, dx, dy, dw, dh);      // Composite to video frame
        } catch (e) {
            console.warn("Wind particle capture failed", e);
            return false;
        }

        return true;
    }, []);

    return { capture };
}
