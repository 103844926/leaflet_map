import { Box, IconButton, Tooltip, Paper, Collapse, Stack } from "@mui/material";
import React, { useState } from "react";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

export function LayerControl({ layers, control }) {
    const [layerExpanded, setLayerExpanded] = useState(true);

    return (
        <Paper
            ref={control?.ref}
            sx={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                padding: 1,
                backgroundColor: "white",
                boxShadow: 3,
            }}
        >
            <IconButton size="small" onClick={() => setLayerExpanded(!layerExpanded)}>
                {layerExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>

            <Collapse in={layerExpanded}>
                <Stack direction="column" spacing={1}>
                    {layers.map((layer) => (
                        <Tooltip key={layer.id} title={layer.tooltip} placement="left">
                            <IconButton
                                onClick={layer.onToggle}
                                sx={{
                                    backgroundColor: layer.isVisible ? "primary.main" : "grey.300",
                                    color: layer.isVisible ? "white" : "grey.600",
                                    "&:hover": {
                                        backgroundColor: layer.isVisible ? "primary.dark" : "grey.400",
                                    },
                                }}
                            >
                                {layer.icon}
                            </IconButton>
                        </Tooltip>
                    ))}
                </Stack>
            </Collapse>
        </Paper>
    );
}