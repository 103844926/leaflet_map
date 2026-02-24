import { Box, TextField, Button, Typography, Stack } from "@mui/material";
import { useEffect, useState } from "react";

export function AreaPositionEditor({ area, onSave, onRename }) {
    const [draftPoints, setDraftPoints] = useState([]);
    const [draftName, setDraftName] = useState("");

    const formatCoord = (value) =>
        Number(value.toFixed(5));

    // Initialize editable copy
    useEffect(() => {
        setDraftPoints(
            area.points.map(p => ({
                lat: formatCoord(p.lat),
                lng: formatCoord(p.lng),
            }))
        );
        setDraftName(area.name || "");
    }, [area]);

    const updatePoint = (index, key, value) => {
        setDraftPoints(prev => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                [key]: Number(value)
            };
            return next;
        });
    };

    const handleSave = () => {
        onSave(draftPoints);
    };

    const handleRevert = () => {
        // Reset draft to current area values (discard unsaved changes)
        setDraftPoints(area.points.map(p => ({ ...p })));
        setDraftName(area.name || "");
    };

    return (
        <Box sx={{ px: 1, gap: 2 }}>
            <Typography variant="h6">Edit Area Positions</Typography>

            <TextField
                size="small"
                label="Area name"
                value={draftName}
                onChange={e => {
                    const value = e.target.value;
                    setDraftName(value);
                    onRename?.(area.id, value);
                }}
                fullWidth
            />
            {/* Position editor */}
            <Stack spacing={1} sx={{ padding: 3, maxHeight: 150, overflowY: "auto" }}>
                {draftPoints.map((p, i) => (
                    <Box
                        key={i}
                        sx={{ display: "grid", gridTemplateColumns: "28px 110px 110px", gap: 1 }}
                    >
                        <Typography>{i + 1}</Typography>

                        <TextField
                            size="small"
                            label="Lat"
                            type="number"
                            inputProps={{
                                step: "any"
                            }}
                            value={p.lat}
                            onChange={e => updatePoint(i, "lat", e.target.value)}
                        />

                        <TextField
                            size="small"
                            label="Lng"
                            type="number"
                            inputProps={{
                                step: "any"
                            }}
                            value={p.lng}
                            onChange={e => updatePoint(i, "lng", e.target.value)}
                        />
                    </Box>
                ))
                }
            </Stack >

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                >
                    Apply Change
                </Button>

                <Button
                    variant="outlined"
                    onClick={handleRevert}
                >
                    Revert
                </Button>
            </Stack>
        </Box >
    );
}
