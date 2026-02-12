// UnifiedShipLayer.jsx - Optimized version for 10k+ ships
import { useRef, useEffect } from "react";
import { useMap } from "react-leaflet";
import * as PIXI from "pixi.js";
import L from "leaflet";
import "leaflet-pixi-overlay";
import { drawPaths } from "./drawPaths";
import { drawMarkers } from "./drawMarkers";
import { drawBackgroundShips } from "./drawBackgroundShips";
import { detectShipMovementStarts } from "@/utils";

export function UnifiedShipLayer({
    shipsToRender, visibleShips, shipPositions,
    onMarkerClick, recordingShipIndex, isRecording, currentTime,
    backgroundShips = [], backgroundShipColor = 0x888888,
    onBackgroundShipClick, selectedShipId
}) {
    const map = useMap();
    const pixiOverlayRef = useRef(null);
    const propsRef = useRef({});
    const movementStartMapRef = useRef(new Map());
    const resourcesRef = useRef({
        spritePool: { sprites: [], labels: [], inUse: 0, labelInUse: 0 },
        bgSpritePool: { sprites: [], inUse: 0 },
        pathGraphics: null,
        bgProjectionGraphics: null,
        shipTexture: null,
        shipTextureNoBorder: null,
        circleTexture: null,
    });

    useEffect(() => {
        movementStartMapRef.current =
            detectShipMovementStarts(shipsToRender, 50);
    }, [shipsToRender]);

    // Store all props in propsRef (update this useEffect when dependency changes)
    useEffect(() => {
        propsRef.current = {
            shipsToRender, visibleShips, shipPositions,
            onMarkerClick, recordingShipIndex, isRecording, currentTime,
            backgroundShips, backgroundShipColor, onBackgroundShipClick, selectedShipId
        };
    }, [shipsToRender, visibleShips, shipPositions,
        onMarkerClick, recordingShipIndex, isRecording, currentTime,
        backgroundShips, backgroundShipColor, onBackgroundShipClick, selectedShipId]);

    useEffect(() => {
        if (!map) return;

        // Capture resources ref at effect creation time
        const resources = resourcesRef.current;

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
            // Read latest React props for this redraw
            const props = propsRef.current;

            // Draw layers with culling & LOD
            // Use resourcesRef.current here since we need the latest value
            const currentResources = resourcesRef.current;

            drawBackgroundShips({
                container, project: latLngToLayerPoint, scale, bounds, renderer,
                backgroundShips: props.backgroundShips,
                backgroundShipColor: props.backgroundShipColor,
                resources: currentResources,
                onBackgroundShipClick: props.onBackgroundShipClick,
                selectedShipId: props.selectedShipId
            });

            drawPaths({
                container, project: latLngToLayerPoint, scale, bounds,
                shipsToRender: props.shipsToRender,
                visibleShips: props.visibleShips,
                shipPositions: props.shipPositions,
                resources: currentResources
            });

            drawMarkers({
                container, project: latLngToLayerPoint, scale, bounds, renderer,
                shipsToRender: props.shipsToRender,
                visibleShips: props.visibleShips,
                shipPositions: props.shipPositions,
                onMarkerClick: props.onMarkerClick,
                recordingShipIndex: props.recordingShipIndex,
                isRecording: props.isRecording,
                resources: currentResources,
                movementStartMap: movementStartMapRef.current,
                currentTime: props.currentTime,
                selectedShipId: props.selectedShipId
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

            // Use the captured resources variable from effect creation
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

    }, [map]);

    useEffect(() => {
        pixiOverlayRef.current?.redraw();
    }, [shipsToRender, visibleShips, shipPositions,
        recordingShipIndex, isRecording,
        backgroundShips, backgroundShipColor, selectedShipId]);

    return null;
}