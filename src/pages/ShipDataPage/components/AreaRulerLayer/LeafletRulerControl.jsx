import L from "leaflet";
import React, { useRef, useEffect, useState } from "react";
import { Paper, Typography, Button, Box, Stack, IconButton } from "@mui/material";
import { Visibility, VisibilityOff, Edit, Delete } from "@mui/icons-material"
import { AreaPositionEditor } from "./AreaPositionEditor";

export function LeafletRulerControl({
    isDrawing,
    onToggleDrawing,
    completedAreas,
    onSaveEdit,
    onRename,
    onToggleVisible,
    onDeleteArea,
}) {
    const controlRef = useRef(null);
    const [editingArea, setEditingArea] = useState(null);

    // Disable click propagation when the DOM element is ready
    useEffect(() => {
        if (controlRef.current) {
            L.DomEvent.disableClickPropagation(controlRef.current);
            L.DomEvent.disableScrollPropagation(controlRef.current);
        }
    }, []);

    const handleEditClick = (areaId) => {
        // Toggle: if already editing this area, close it
        if (editingArea?.id === areaId) {
            setEditingArea(null);
            return;
        }

        const area = completedAreas.find(a => a.id === areaId);
        if (!area) return;

        setEditingArea({ ...area });
    };

    const handleSave = (newPoints) => {
        if (!editingArea) return;
        onSaveEdit(editingArea.id, newPoints);
    };

    const handleDelete = (areaId) => {
        // Close editor if deleting the area being edited
        if (editingArea?.id === areaId) {
            setEditingArea(null);
        }
        onDeleteArea(areaId);
    };

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
                onClick={onToggleDrawing}
                variant="contained"
                sx={{
                    padding: '8px 12px',
                    background: isDrawing ? '#ff4444' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    '&:hover': {
                        background: isDrawing ? '#cc0000' : '#45a049',
                        transform: 'scale(1.02)'
                    }
                }}
            >
                {isDrawing ? 'Stop Drawing' : 'Start Drawing'}
            </Button>

            {/* Completed Areas List */}
            <Paper variant="outlined" sx={{ p: 1 }}>
                <Typography variant="caption">Completed Areas</Typography>
                {completedAreas.map(area => (
                    <Box
                        key={area.id}
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 1,
                            spacing: 2
                        }}
                    >
                        <Typography variant="body2">
                            {area.name?.trim()
                                ? area.name
                                : `Area${area.id.slice(0, 10)}`}
                        </Typography>

                        <Stack direction="row" justifyContent="flex-end">
                            <IconButton
                                size="small"
                                onClick={() => onToggleVisible(area.id)}
                            >
                                {area.visible ? <Visibility /> : <VisibilityOff />}
                            </IconButton>

                            <IconButton
                                size="small"
                                onClick={() => handleEditClick(area.id)}
                            >
                                <Edit />
                            </IconButton>

                            <IconButton
                                size="small"
                                onClick={() => handleDelete(area.id)}
                            >
                                <Delete />
                            </IconButton>
                        </Stack>
                    </Box>
                ))}
            </Paper>

            {editingArea && (
                <AreaPositionEditor
                    area={editingArea}
                    onSave={handleSave}
                    onRename={onRename}
                />
            )}
        </Paper>
    );
}