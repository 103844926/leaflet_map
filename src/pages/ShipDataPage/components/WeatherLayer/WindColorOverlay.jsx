// WindColorOverlay.jsx - Draw wind heatmap using pixi.js
import { useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import * as PIXI from "pixi.js";
import { isValidWindData, calculateTimeIndex, isValidTimeRange, calculateWindMetrics } from "@/utils";

export function WindColorOverlay({
    windData,
    selectedTime,
    minTime,
    maxTime,
}) {
    // Get map instance and store refs
    const map = useMap();
    const containerRef = useRef(null);
    const pixiAppRef = useRef(null);
    const spriteRef = useRef(null);
    const lastTimeIndexRef = useRef(null);

    // Wind speed to color mapping (similar to Windy)
    const getColorForSpeed = (speed) => {
        // Speed in m/s -> RGB color
        if (speed < 1) return [0, 0, 139, 50];      // Dark blue, transparent
        if (speed < 3) return [0, 139, 255, 80];    // Blue
        if (speed < 5) return [0, 255, 255, 100];   // Cyan
        if (speed < 7) return [0, 255, 0, 120];     // Green
        if (speed < 10) return [255, 255, 0, 140];  // Yellow
        if (speed < 15) return [255, 165, 0, 160];  // Orange
        if (speed < 20) return [255, 69, 0, 180];   // Red-orange
        return [255, 0, 0, 200];                    // Red
    };

    // Build texture from wind data
    const buildWindTexture = useCallback((windData, tIndex) => {
        if (!windData || !windData.u?.[tIndex] || !windData.v?.[tIndex]) return null;

        const { nx, ny, u, v } = windData;
        const uData = u[tIndex];
        const vData = v[tIndex];

        // Create RGBA array
        const pixels = new Uint8Array(nx * ny * 4);

        for (let i = 0; i < nx * ny; i++) {
            const uVal = uData[i];
            const vVal = vData[i];
            const { speed } = calculateWindMetrics(uVal, vVal);
            const color = getColorForSpeed(speed);

            pixels[i * 4] = color[0];           // R
            pixels[i * 4 + 1] = color[1];       // G
            pixels[i * 4 + 2] = color[2];       // B
            pixels[i * 4 + 3] = color[3];       // A
        }

        return { pixels, width: nx, height: ny };
    }, []);

    // Update sprite position and size based on map bounds
    const updateSpriteTransform = useCallback(() => {
        const sprite = spriteRef.current;

        if (
            !sprite ||
            sprite.destroyed ||
            !windData ||
            !map
        ) return;

        const { lo1, la1, lo2, la2 } = windData;

        // Convert lat/lon bounds to pixel coordinates
        const topLeft = map.latLngToContainerPoint([la1, lo1]);
        const bottomRight = map.latLngToContainerPoint([la2, lo2]);

        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;

        spriteRef.current.x = topLeft.x;
        spriteRef.current.y = topLeft.y;
        spriteRef.current.width = width;
        spriteRef.current.height = height;
    }, [windData, map]);

    // Initialize Pixi
    useEffect(() => {
        if (!map) return;

        const container = map.getContainer();
        const canvas = document.createElement("canvas");
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "400"; // Below controls but above tiles
        canvas.className = "wind-color-overlay";
        container.appendChild(canvas);
        containerRef.current = canvas;

        const app = new PIXI.Application({
            view: canvas,
            width: container.offsetWidth,
            height: container.offsetHeight,
            backgroundAlpha: 0, // This is key for transparency
            antialias: false,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        pixiAppRef.current = app;

        // expose for recording
        map._windPixiApp = app;

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            app.renderer.resize(container.offsetWidth, container.offsetHeight);
            updateSpriteTransform();
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            spriteRef.current = null;
            delete map._windPixiApp;

            app.destroy(true, { children: true });

            if (containerRef.current) {
                containerRef.current.remove();
                containerRef.current = null;
            }
        };

    }, [map, updateSpriteTransform]);

    // Update texture at initial load and when data changes
    useEffect(() => {
        if (
            !pixiAppRef.current ||
            !isValidWindData(windData) ||
            !isValidTimeRange(minTime, maxTime, selectedTime)
        ) return;

        const idx = calculateTimeIndex(
            selectedTime,
            minTime,
            maxTime,
            windData.ts.length
        );

        if (idx === lastTimeIndexRef.current) return;
        lastTimeIndexRef.current = idx;

        const textureData = buildWindTexture(windData, idx);
        if (!textureData) return;

        const { pixels, width, height } = textureData;

        // Create or update texture
        const baseTexture = PIXI.BaseTexture.fromBuffer(
            pixels,
            width,
            height,
            {
                scaleMode: PIXI.SCALE_MODES.LINEAR,
                format: PIXI.FORMATS.RGBA,
            }
        );

        const texture = new PIXI.Texture(baseTexture);

        // Remove old sprite
        if (spriteRef.current) {
            pixiAppRef.current.stage.removeChild(spriteRef.current);
            spriteRef.current.destroy();
        }

        // Create new sprite
        const sprite = new PIXI.Sprite(texture);
        sprite.alpha = 0.6; // Semi-transparent overlay
        spriteRef.current = sprite;

        pixiAppRef.current.stage.addChild(sprite);
        updateSpriteTransform();

    }, [windData, selectedTime, minTime, maxTime, buildWindTexture, updateSpriteTransform]);

    // Update on map move/zoom
    useEffect(() => {
        if (!map) return;

        const onMapChange = () => {
            updateSpriteTransform();
        };

        map.on("move", onMapChange);
        map.on("zoom", onMapChange);

        return () => {
            map.off("move", onMapChange);
            map.off("zoom", onMapChange);
        };
    }, [map, updateSpriteTransform]);

    return null;
}