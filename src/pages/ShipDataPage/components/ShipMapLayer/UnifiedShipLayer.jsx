// UnifiedShipLayer.jsx - Optimized version for 10k+ ships
import { useRef, useEffect } from "react";
import { useMap } from "react-leaflet";
import * as PIXI from "pixi.js";
import L from "leaflet";
import "leaflet-pixi-overlay";
import { drawPaths } from "./drawPaths";
import { drawMarkers } from "./drawMarkers";
import { drawBackground } from "./drawBackground";
import { detectShipMovementStartsDetailed } from "@/utils";

export function UnifiedShipLayer({
    ships, filteredShips, shipsToRender, visibleShips, shipPositions,
    onMarkerClick, showPaths, recordingShipIndex, isRecording, currentTime,
    backgroundShips = [], showBackgroundShips = true, backgroundShipColor = 0x888888,
}) {
    const map = useMap();
    const pixiOverlayRef = useRef(null);
    const propsRef = useRef({});
    const movementStartMap = detectShipMovementStartsDetailed(ships, 50);
    const resourcesRef = useRef({
        spritePool: { sprites: [], labels: [], inUse: 0, labelInUse: 0 },
        bgSpritePool: { sprites: [], inUse: 0 },
        pathGraphics: null,
        shipTexture: null,
        shipTextureNoBorder: null,
        circleTexture: null,
    });

    useEffect(() => {
        propsRef.current = {
            ships, filteredShips, shipsToRender, visibleShips, shipPositions,
            onMarkerClick, showPaths, recordingShipIndex, isRecording, currentTime,
            backgroundShips, showBackgroundShips, backgroundShipColor,
        };
    }, [ships, filteredShips, shipsToRender, visibleShips, shipPositions,
        onMarkerClick, showPaths, recordingShipIndex, isRecording, currentTime,
        backgroundShips, showBackgroundShips, backgroundShipColor]);

    useEffect(() => {
        if (!map) return;

        const pixiContainer = new PIXI.Container();
        const overlay = L.pixiOverlay((utils) => {
            const { getContainer, latLngToLayerPoint, getScale, getRenderer } = utils;
            const container = getContainer();
            const scale = getScale();
            const renderer = getRenderer();
            const bounds = map.getBounds();

            if (!overlay._renderer) {
                overlay._renderer = renderer;
                overlay._pixiContainer = container;
            }

            container.removeChildren();
            const props = propsRef.current;
            const resources = resourcesRef.current;

            // Draw layers with culling & LOD
            drawBackground({
                container, project: latLngToLayerPoint, scale, bounds, renderer,
                backgroundShips: props.backgroundShips,
                showBackgroundShips: props.showBackgroundShips,
                backgroundShipColor: props.backgroundShipColor,
                resources
            });

            drawPaths({
                container, project: latLngToLayerPoint, scale, bounds,
                ships: props.ships,
                shipsToRender: props.shipsToRender,
                visibleShips: props.visibleShips,
                shipPositions: props.shipPositions,
                showPaths: props.showPaths,
                resources
            });

            drawMarkers({
                container, project: latLngToLayerPoint, scale, bounds, renderer,
                shipsToRender: props.shipsToRender,
                filteredShips: props.filteredShips,
                visibleShips: props.visibleShips,
                shipPositions: props.shipPositions,
                onMarkerClick: props.onMarkerClick,
                recordingShipIndex: props.recordingShipIndex,
                isRecording: props.isRecording,
                resources,
                movementStartMap,
                currentTime: props.currentTime,  // Add this
            });

            renderer.render(container);
        }, pixiContainer);

        pixiOverlayRef.current = overlay;
        overlay.addTo(map);
        map.pixiOverlay = overlay;

        const redraw = () => overlay.redraw();
        map.on("zoomend moveend", redraw);

        return () => {
            map.off("zoomend moveend", redraw);
            map.removeLayer(overlay);
            if (map.pixiOverlay === overlay) delete map.pixiOverlay;

            // Copy ref to local variable for cleanup
            // eslint-disable-next-line
            const resources = resourcesRef.current;
            if (resources.shipTexture) {
                resources.shipTexture.destroy(true);
            }
            if (resources.shipTextureNoBorder) {
                resources.shipTextureNoBorder.destroy(true);
            }
            if (resources.circleTexture) {
                resources.circleTexture.destroy(true);
            }
        };
        // eslint-disable-next-line
    }, [map]);

    useEffect(() => {
        pixiOverlayRef.current?.redraw();
    }, [ships, filteredShips, shipsToRender, visibleShips, shipPositions,
        showPaths, recordingShipIndex, isRecording,
        backgroundShips, showBackgroundShips, backgroundShipColor]);

    return null;
}