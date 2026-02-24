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
                // Responsive positioning
                top: { xs: 8, sm: 12, md: 16 },
                right: { xs: 56, sm: 68, md: 80 },
                zIndex: 1000,
                background: 'white',
                // Responsive padding
                p: { xs: 1, sm: 1.5, md: 2 },
                borderRadius: { xs: 1, sm: 2 },
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 0.5, sm: 1 },
                // Flexible width
                minWidth: { xs: 160, sm: 180, md: 200 },
                maxWidth: { xs: 280, sm: 320, md: 360 },
                // Make it scrollable if content overflows
                maxHeight: { xs: 'calc(100vh - 80px)', sm: 'calc(100vh - 100px)' },
                overflowY: 'auto'
            }}>
            <Typography
                variant="h6"
                sx={{
                    marginBottom: { xs: 0.5, sm: 1 },
                    color: '#333',
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                }}>
                Area Controls
            </Typography>

            {/* Drawing Mode Toggle */}
            <Button
                onClick={onToggleDrawing}
                variant="contained"
                size="small"
                sx={{
                    padding: { xs: '6px 10px', sm: '8px 12px' },
                    background: isDrawing ? '#ff4444' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: 1,
                    cursor: 'pointer',
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
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
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 0.5, sm: 1 },
                    mt: { xs: 0.5, sm: 1 }
                }}
            >
                <Typography
                    variant="caption"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                    Completed Areas
                </Typography>
                {completedAreas.map(area => (
                    <Box
                        key={area.id}
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: { xs: 0.5, sm: 1 },
                            mt: 0.5
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {area.name?.trim()
                                ? area.name
                                : `Area${area.id.slice(0, 10)}`}
                        </Typography>

                        <Stack direction="row" spacing={0.5}>
                            <IconButton
                                size="small"
                                onClick={() => onToggleVisible(area.id)}
                                sx={{
                                    p: { xs: 0.25, sm: 0.5 },
                                    '& svg': { fontSize: { xs: '1rem', sm: '1.25rem' } }
                                }}
                            >
                                {area.visible ? <Visibility /> : <VisibilityOff />}
                            </IconButton>

                            <IconButton
                                size="small"
                                onClick={() => handleEditClick(area.id)}
                                sx={{
                                    p: { xs: 0.25, sm: 0.5 },
                                    '& svg': { fontSize: { xs: '1rem', sm: '1.25rem' } }
                                }}
                            >
                                <Edit />
                            </IconButton>

                            <IconButton
                                size="small"
                                onClick={() => handleDelete(area.id)}
                                sx={{
                                    p: { xs: 0.25, sm: 0.5 },
                                    '& svg': { fontSize: { xs: '1rem', sm: '1.25rem' } }
                                }}
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