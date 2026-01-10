import { Box, TextField, Button, Typography, Stack } from "@mui/material";
import { useEffect, useState } from "react";

export function AreaPositionEditor({ area, onSave, onCancel, onRename }) {
    const [draftPoints, setDraftPoints] = useState([]);
    const [draftName, setDraftName] = useState("");

    // Initialize editable copy
    useEffect(() => {
        setDraftPoints(area.points.map(p => ({ ...p })));
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

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6">Edit Area Positions</Typography>

            <TextField
                size="small"
                label="Area name"
                value={area.name || draftName}
                onChange={e => {
                    const value = e.target.value;
                    setDraftName(value);
                    onRename?.(area.id, value); // 🔥 auto update
                }}
                fullWidth
            />
            {/* Position editor */}
            <Stack spacing={1} sx={{ paddingTop: 3, maxHeight: 300, overflowY: "auto" }}>
                {draftPoints.map((p, i) => (
                    <Box
                        key={i}
                        sx={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr", gap: 1 }}
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
                ))}
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                    variant="contained"
                    onClick={() => onSave(draftPoints)}
                >
                    Save
                </Button>

                <Button
                    variant="outlined"
                    onClick={onCancel}
                >
                    Revert
                </Button>
            </Stack>
        </Box>
    );
}
