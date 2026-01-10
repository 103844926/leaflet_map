import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { clearAllElements } from "@/utils";
import { useRulerHandlers, useRulerAreas } from "@/hooks";
import { Paper, Typography, Button, Chip, Box, IconButton } from "@mui/material";
import { Edit } from "@mui/icons-material"
import { AreaPositionEditor } from "./AreaPositionEditor";

export function LeafletRulerControl() {
    const map = useMap();
    const refs = useRef(null);
    const controlRef = useRef(null);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [hasAnchorUI, setHasAnchorUI] = useState(false);
    const [completedAreasUI, setCompletedAreasUI] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState(null);
    const [editingArea, setEditingArea] = useState(null);

    if (!refs.current) {
        refs.current = {
            isActive: { current: false }, // Start as inactive
            hasAnchor: { current: false },
            chainStartIndex: { current: null },
            completedAreas: { current: [] },

            points: { current: [] },
            lines: { current: [] },
            labels: { current: [] },

            fillCircle: { current: null },
            ringLayer: { current: null },
            ringLabels: { current: null },

            tempLine: { current: null },
            tempLabel: { current: null },
        };
    }

    const addCompletedAreaUI = (area) => {
        setCompletedAreasUI(prev => [...prev, area]);
    };

    const handlers = useRulerHandlers(map, refs.current, {
        setHasAnchorUI,
        addCompletedAreaUI
    });
    const areaControls = useRulerAreas(map, refs.current);

    // Toggle drawing mode
    const handleToggleDrawing = () => {
        const newMode = !isDrawingMode;
        setIsDrawingMode(newMode);
        refs.current.isActive.current = newMode;

        if (!newMode) {
            setHasAnchorUI(false);
        }

        map.getContainer().style.cursor = newMode ? "crosshair" : "";
    };

    // Set Area Editing
    const startEditArea = (areaId) => {
        const area = refs.current.completedAreas.current.find(a => a.id === areaId);
        if (!area) return;

        setSelectedAreaId(areaId);
        setEditingArea({
            id: area.id,
            points: area.points
        });
    };

    const renameArea = (areaId, newName) => {
        // Update UI state
        setCompletedAreasUI(prev =>
            prev.map(a =>
                a.id === areaId ? { ...a, name: newName } : a
            )
        );

        // Update ref (authoritative)
        const area = refs.current.completedAreas.current.find(a => a.id === areaId);
        if (area) {
            area.name = newName;
        }
    };

    const handleSaveAreaEdit = (newPoints) => {
        const area = refs.current.completedAreas.current.find(
            a => a.id === selectedAreaId
        );

        if (!area) return;

        // Update Leaflet polygon geometry
        const latlngs = newPoints.map(p => L.latLng(p.lat, p.lng));
        area.polygon.setLatLngs([latlngs]);

        // Persist updated coordinates
        area.points = newPoints.map(p => ({ ...p }));
        handlers.updateCompletedArea(selectedAreaId, newPoints);

        // Close editor UI
        setEditingArea(null);
        setSelectedAreaId(null);
    };

    // Disable click propagation when the DOM element is ready
    useEffect(() => {
        if (controlRef.current) {
            L.DomEvent.disableClickPropagation(controlRef.current);
            L.DomEvent.disableScrollPropagation(controlRef.current);
        }
    }, []);

    useEffect(() => {
        if (!map) return;

        map.on("click", handlers.onMapClick);
        map.on("mousemove", handlers.onMouseMove);

        return () => {
            if (!map) return;

            map.off("click", handlers.onMapClick);
            map.off("mousemove", handlers.onMouseMove);
        };
    }, [map, handlers]);

    useEffect(() => {
        return () => {
            if (!map) return;
            // Clear everything only when component unmounts
            clearAllElements(refs.current, map);
        };
    }, [map]); // Only depends on map, runs cleanup only on unmount

    return (
        <Paper
            ref={controlRef}
            sx={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                background: 'white',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minWidth: '180px'
            }}>
            <Typography
                variant="h6"
                sx={{
                    marginBottom: '4px',
                    color: '#333'
                }}>
                Area Controls
            </Typography>

            {/* Drawing Mode Toggle */}
            <Button
                onClick={handleToggleDrawing}
                variant="contained"
                sx={{
                    padding: '8px 12px',
                    background: isDrawingMode ? '#ff4444' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    '&:hover': {
                        background: isDrawingMode ? '#cc0000' : '#45a049',
                        transform: 'scale(1.02)'
                    }
                }}
            >
                {isDrawingMode ? 'Stop Drawing' : 'Start Drawing'}
            </Button>

            {/* Status Chip */}
            {isDrawingMode && (
                <Chip
                    label={hasAnchorUI ? "Click to add points" : "Click to start area"}
                    size="small"
                />
            )}

            {/* Completed Areas List */}
            <Paper variant="outlined" sx={{ p: 1 }}>
                <Typography variant="caption">Completed Areas</Typography>

                {completedAreasUI.map(area => (
                    <Box
                        key={area.id}
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 1
                        }}
                    >
                        <Typography variant="body2">
                            {area.name?.trim()
                                ? area.name
                                : `Area ${area.id.slice(0, 4)}`}
                        </Typography>

                        <IconButton
                            size="small"
                            onClick={() => startEditArea(area.id)}
                        >
                            <Edit />
                        </IconButton>
                    </Box>
                ))}
            </Paper>

            {editingArea && (
                <AreaPositionEditor
                    area={editingArea}
                    onSave={handleSaveAreaEdit}
                    onCancel={() => {
                        setEditingArea(null);
                        setSelectedAreaId(null);
                    }}
                    onRename={renameArea}
                />
            )}

            <Typography variant="caption" sx={{ color: '#666', fontSize: '11px', fontStyle: 'italic' }}>
                Save & Load
            </Typography>

            <Button
                onClick={areaControls.handleSaveCurrentArea}
                sx={{
                    padding: '8px 12px',
                    background: '#4444ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'background 0.2s',
                    '&:hover': {
                        background: '#3333dd'
                    }
                }}
            >
                Save as JSON
            </Button>

            <Button
                onClick={areaControls.handleSaveAllAreas}
                sx={{
                    padding: '8px 12px',
                    background: '#ff6b35',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'background 0.2s',
                    '&:hover': {
                        background: '#e55a24'
                    }
                }}
            >
                Save All Areas
            </Button>

            <Button
                onClick={areaControls.triggerFileInput}
                sx={{
                    padding: '8px 12px',
                    background: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'background 0.2s',
                    '&:hover': {
                        background: '#27ae60'
                    }
                }}
            >
                Load Area
            </Button>

            <input
                ref={areaControls.fileInputRef}
                type="file"
                accept=".json"
                onChange={areaControls.handleLoadArea}
                style={{ display: 'none' }}
            />
        </Paper>
    );
}