import { useCallback, useRef } from "react";
import { createMarker, createPolygon, loadAreaFromJSON, restoreAreaOnMap, saveAreaAsJSON } from "@/utils";

export function useRulerAreas(map, refs) {
    const fileInputRef = useRef(null);

    const handleSaveCurrentArea = useCallback(() => {
        // Check if there's a completed area to save
        if (refs.completedAreas.current.length === 0) {
            alert("No completed area to save. Complete a polygon first by clicking the first marker.");
            return;
        }

        // Get the most recently completed area
        const latestArea = refs.completedAreas.current[refs.completedAreas.current.length - 1];

        const areaData = {
            type: "area",
            timestamp: latestArea.timestamp,
            points: latestArea.points,
            metadata: {
                pointCount: latestArea.points.length,
                created: latestArea.timestamp
            }
        };

        saveAreaAsJSON(areaData);
    }, [refs]);

    const handleSaveAllAreas = useCallback(() => {
        if (refs.completedAreas.current.length === 0) {
            alert("No completed areas to save.");
            return;
        }

        const allAreasData = {
            type: "areas_collection",
            timestamp: new Date().toISOString(),
            areas: refs.completedAreas.current.map(area => ({
                points: area.points
            })),
            metadata: {
                totalAreas: refs.completedAreas.current.length,
                created: new Date().toISOString()
            }
        };

        const jsonStr = JSON.stringify(allAreasData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `all_areas_${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }, [refs]);

    const handleLoadArea = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const areaData = await loadAreaFromJSON(file);
            const result = restoreAreaOnMap(
                areaData,
                map,
                refs,
                createMarker,
                createPolygon
            );

            alert(`Area loaded successfully! ${result.pointCount} points restored.`);
        } catch (error) {
            alert(`Failed to load area: ${error.message}`);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [map, refs]);

    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return {
        fileInputRef,
        handleSaveCurrentArea,
        handleSaveAllAreas,
        handleLoadArea,
        triggerFileInput
    };
}