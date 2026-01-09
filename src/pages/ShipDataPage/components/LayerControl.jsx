import { IconButton, Tooltip, Paper, Collapse, Stack } from "@mui/material";
import React, { useState } from "react";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

export function LayerControl({ layers, control }) {
    const [layerExpanded, setLayerExpanded] = useState(true);

    return (
        <Paper
            ref={control?.ref}
            sx={{
                position: "absolute",
                p: { xs: 0.5, sm: 1 },
                right: { xs: 8, sm: 20 },
                top: { xs: 8, sm: 20 },
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                boxShadow: 1,
                borderRadius: 2,
            }}
        >
            <IconButton
                size="small"
                onClick={() => setLayerExpanded(!layerExpanded)}
                sx={{
                    width: { xs: 48, sm: 36 },
                    height: { xs: 48, sm: 36 },
                    color: "white",
                }}>
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
                                    width: { xs: 48, sm: 36 },
                                    height: { xs: 48, sm: 36 },
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