import { useEffect, useState, useRef, useCallback } from "react";
import { saveAreas, loadAreas } from "@/utils";
import { DrawingLayer } from "./DrawingLayer";
import { CompletedAreaLayer } from "./CompletedAreaLayer";
import { LeafletRulerControl } from "./LeafletRulerControl";

export function AreaRulerLayer({ active }) {
    const drawingLayerRef = useRef(null);
    const completedAreasLayerRef = useRef(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [completedAreas, setCompletedAreas] = useState([]);
    const [initialAreasLoaded, setInitialAreasLoaded] = useState(false);

    /* ---------------------------------
    * Auto load areas on mount
    * --------------------------------- */
    useEffect(() => {
        const savedAreas = loadAreas();
        if (savedAreas.length) {
            setCompletedAreas(savedAreas);
        }
        setInitialAreasLoaded(true);
    }, []);

    /* ---------------------------------
    * Auto-save areas when they change
    * --------------------------------- */
    useEffect(() => {
        if (initialAreasLoaded) {
            saveAreas(completedAreas);
        }
    }, [completedAreas, initialAreasLoaded]);

    /* ---------------------------------
     * Disable drawing when inactive
     * --------------------------------- */
    useEffect(() => {
        if (!active && isDrawing) {
            setIsDrawing(false);
        }
    }, [active, isDrawing]);

    /* -----------------------------
     * Drawing Layer → UI
     * ----------------------------- */
    const handleCompletedArea = useCallback((area) => {
        const areaWithVisibility = {
            ...area,
            visible: true, // default visible
        };

        setCompletedAreas(prev => [...prev, areaWithVisibility]);

        // Also add to completed areas layer
        completedAreasLayerRef.current?.createAreaFromData(areaWithVisibility);
    }, []);

    /* -----------------------------
     * UI → Completed Areas Layer
     * ----------------------------- */
    const handleSaveEdit = (areaId, newPoints) => {
        setCompletedAreas(prev =>
            prev.map(a =>
                a.id === areaId
                    ? { ...a, points: newPoints }
                    : a
            )
        );

        completedAreasLayerRef.current?.updateArea(areaId, newPoints);
    };

    const handleRename = (areaId, name) => {
        setCompletedAreas(prev =>
            prev.map(a =>
                a.id === areaId ? { ...a, name } : a
            )
        );

        completedAreasLayerRef.current?.renameArea(areaId, name);
    };

    const handleToggleVisible = (areaId) => {
        setCompletedAreas(prev =>
            prev.map(a =>
                a.id === areaId
                    ? { ...a, visible: !a.visible }
                    : a
            )
        );

        const area = completedAreas.find(a => a.id === areaId);
        if (!area) return;

        completedAreasLayerRef.current?.setAreaVisible(areaId, !area.visible);
    };

    const handleDeleteArea = (areaId) => {
        setCompletedAreas(prev => prev.filter(a => a.id !== areaId));
        completedAreasLayerRef.current?.deleteArea(areaId);
    };

    return (
        <>
            <DrawingLayer
                ref={drawingLayerRef}
                drawingEnabled={isDrawing}
                onCompletedArea={handleCompletedArea}
            />

            <CompletedAreaLayer
                ref={completedAreasLayerRef}
                initialAreas={initialAreasLoaded ? completedAreas : []}
            />

            {active && (
                <LeafletRulerControl
                    isDrawing={isDrawing}
                    onToggleDrawing={() => setIsDrawing(d => !d)}
                    completedAreas={completedAreas}
                    onSaveEdit={handleSaveEdit}
                    onRename={handleRename}
                    onToggleVisible={handleToggleVisible}
                    onDeleteArea={handleDeleteArea}
                />
            )}
        </>
    );
}