import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import * as PIXI from "pixi.js";
import { isValidWindData, calculateTimeIndex, isValidTimeRange } from "@/utils";
import { WindParticleExportSystem } from "./WindParticleExportSystem";

export function WindParticleExportLayer({
    windData,
    selectedTime,
    minTime,
    maxTime,
    enabled,
}) {
    const map = useMap();

    const appRef = useRef(null);
    const systemRef = useRef(null);
    const lastIndexRef = useRef(null);

    /* --------------------------------------------------
     * 1️⃣ Create PIXI app + canvas
     * -------------------------------------------------- */
    useEffect(() => {
        if (!map || !enabled) return;

        const container = map.getContainer();

        const canvas = document.createElement("canvas");
        Object.assign(canvas.style, {
            position: "absolute",
            top: "0",
            left: "0",
            pointerEvents: "none",
            zIndex: "410",
        });

        container.appendChild(canvas);

        const app = new PIXI.Application({
            view: canvas,
            width: container.offsetWidth,
            height: container.offsetHeight,
            backgroundAlpha: 0,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
        });

        appRef.current = app;
        map._windParticleExportApp = app;
        delete map._windParticleExportSystem;

        const resize = () => {
            const size = map.getSize();
            app.renderer.resize(size.x, size.y);
        };

        map.on("resize", resize);
        resize();

        return () => {
            map.off("resize", resize);
            delete map._windParticleExportApp;
            delete map._windParticleExportSystem;

            app.destroy(true, { children: true });
            canvas.remove();
        };
    }, [map, enabled]);

    /* --------------------------------------------------
     * 2️⃣ Create / update particle system when time changes
     * -------------------------------------------------- */
    useEffect(() => {
        if (
            !enabled ||
            !appRef.current ||
            !isValidWindData(windData) ||
            !isValidTimeRange(minTime, maxTime, selectedTime)
        ) return;

        const idx = calculateTimeIndex(
            selectedTime,
            minTime,
            maxTime,
            windData.ts.length
        );

        if (idx === lastIndexRef.current) return;
        lastIndexRef.current = idx;

        if (systemRef.current) {
            appRef.current.stage.removeChild(systemRef.current.graphics);
            systemRef.current.destroy();
            systemRef.current = null;
        }

        const system = new WindParticleExportSystem({
            map,
            windData,
            timeIndex: idx,
        });

        systemRef.current = system;
        map._windParticleExportSystem = system;

        appRef.current.stage.addChild(system.graphics);
    }, [enabled, windData, selectedTime, minTime, maxTime, map]);

    /* --------------------------------------------------
     * 3️⃣ VISUAL render loop (no step, render only)
     * -------------------------------------------------- */
    useEffect(() => {
        if (!enabled || !appRef.current || !systemRef.current) return;

        let raf;

        const draw = () => {
            if (!systemRef.current || !appRef.current) return;
            systemRef.current.render();
            appRef.current.renderer.render(appRef.current.stage);
            raf = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(raf);
    }, [enabled]);

    return null;
}
