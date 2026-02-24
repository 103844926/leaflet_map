import { useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useMap } from "react-leaflet";
import * as PIXI from "pixi.js";
import L from "leaflet";
import "leaflet-pixi-overlay";
import { RULER_COLORS, RULER_CONFIG, calculateBearing, formatDistance } from "@/utils/rulerUtils";

/**
 * CompletedAreaLayer
 * -------------------------
 * Uses leaflet-pixi-overlay to share WebGL context with ship layer
 * Prevents WebGL context conflicts and improves performance
 */
export const CompletedAreaLayer = forwardRef(function CompletedAreaLayer(
    { initialAreas = [] },
    ref
) {
    const map = useMap();
    const pixiOverlayRef = useRef(null);
    const areasRef = useRef([]);
    const propsRef = useRef({ areas: [] });

    // Update propsRef when areas change
    useEffect(() => {
        propsRef.current.areas = areasRef.current;
    }, []);

    // Draw all areas
    const drawAllAreas = useCallback((utils) => {
        const { getContainer, latLngToLayerPoint, getRenderer } = utils;
        const container = getContainer();
        const renderer = getRenderer();

        container.removeChildren();

        const areas = propsRef.current.areas;

        areas.forEach(area => {
            if (!area.visible) return;

            const graphics = new PIXI.Graphics();

            // Draw polygon fill and stroke
            graphics.beginFill(
                parseInt(RULER_COLORS.polygonFill.replace('#', ''), 16),
                RULER_CONFIG.polygonFillOpacity
            );
            graphics.lineStyle(
                RULER_CONFIG.polygonStrokeWeight,
                parseInt(RULER_COLORS.polygonStroke.replace('#', ''), 16),
                RULER_CONFIG.polygonStrokeOpacity
            );

            const points = area.points.map(p => latLngToLayerPoint([p.lat, p.lng]));

            if (points.length > 0) {
                graphics.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    graphics.lineTo(points[i].x, points[i].y);
                }
                graphics.closePath();
            }

            graphics.endFill();

            // Draw edge labels
            for (let i = 0; i < points.length; i++) {
                const a = points[i];
                const b = points[(i + 1) % points.length];

                // Calculate midpoint
                const midX = (a.x + b.x) / 2;
                const midY = (a.y + b.y) / 2;

                // Calculate distance and bearing
                const latLngA = area.points[i];
                const latLngB = area.points[(i + 1) % area.points.length];
                const distance = map.distance(
                    [latLngA.lat, latLngA.lng],
                    [latLngB.lat, latLngB.lng]
                );

                const bearing = calculateBearing(latLngA, latLngB);
                const distText = formatDistance(distance);

                // Draw label background
                const labelWidth = 50;
                const labelHeight = 30;
                graphics.beginFill(0x000000, 0.8);
                graphics.drawRoundedRect(
                    midX - labelWidth / 2,
                    midY - labelHeight / 2,
                    labelWidth,
                    labelHeight,
                    4
                );
                graphics.endFill();

                // Add text
                const text = new PIXI.Text(`${distText}\n${bearing}°`, {
                    fontFamily: 'Arial',
                    fontSize: 9,
                    fill: 0xffffff,
                    align: 'center',
                });
                text.anchor.set(0.5);
                text.x = midX;
                text.y = midY;
                graphics.addChild(text);
            }

            container.addChild(graphics);
        });

        renderer.render(container);
    }, [map]);

    // Initialize PIXI overlay
    useEffect(() => {
        if (!map) return;

        // Create custom pane if it doesn't exist
        const paneName = 'completedAreasPane';
        if (!map.getPane(paneName)) {
            map.createPane(paneName);
            const pane = map.getPane(paneName);
            pane.style.zIndex = 400; // Same as before
            pane.style.pointerEvents = 'none';
        }

        const pixiContainer = new PIXI.Container();

        const overlay = L.pixiOverlay((utils) => {
            drawAllAreas(utils);
        }, pixiContainer, {
            // Set padding for rendering outside viewport
            padding: 0.1,
            // Set pane for z-index control
            pane: paneName
        });

        pixiOverlayRef.current = overlay;
        overlay.addTo(map);

        // Store reference on map for external access if needed
        map.completedAreasOverlay = overlay;

        // Redraw on map changes
        const redraw = () => overlay.redraw();
        map.on("zoomend moveend", redraw);

        return () => {
            map.off("zoomend moveend", redraw);
            map.removeLayer(overlay);
            if (map.completedAreasOverlay === overlay) {
                delete map.completedAreasOverlay;
            }
        };
    }, [map, drawAllAreas]);

    // Load initial areas
    useEffect(() => {
        if (!initialAreas.length) return;

        initialAreas.forEach(area => {
            const exists = areasRef.current.some(a => a.id === area.id);
            if (!exists) {
                areasRef.current.push({
                    ...area,
                    visible: area.visible ?? true
                });
            }
        });

        propsRef.current.areas = areasRef.current;
        pixiOverlayRef.current?.redraw();
    }, [initialAreas]);

    // Redraw when areas change
    const triggerRedraw = () => {
        propsRef.current.areas = areasRef.current;
        pixiOverlayRef.current?.redraw();
    };

    // Expose API methods
    useImperativeHandle(ref, () => ({
        createAreaFromData(area) {
            const exists = areasRef.current.some(a => a.id === area.id);
            if (exists) return;

            areasRef.current.push({
                ...area,
                visible: area.visible ?? false
            });

            triggerRedraw();
        },

        updateArea(id, newPoints) {
            const area = areasRef.current.find(a => a.id === id);
            if (!area) return;

            area.points = newPoints.map(p => ({ ...p }));
            triggerRedraw();
        },

        renameArea(id, name) {
            const area = areasRef.current.find(a => a.id === id);
            if (area) {
                area.name = name;
            }
        },

        setAreaVisible(id, visible) {
            const area = areasRef.current.find(a => a.id === id);
            if (!area) return;

            area.visible = visible;
            triggerRedraw();
        },

        deleteArea(id) {
            const index = areasRef.current.findIndex(a => a.id === id);
            if (index === -1) return;

            areasRef.current.splice(index, 1);
            triggerRedraw();
        }
    }));

    return null;
});