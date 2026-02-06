import React from "react";
import { Stack, Typography, Checkbox, FormControlLabel, Slider, Chip, FormControl, InputLabel, Select, MenuItem, ListItemText } from "@mui/material";

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

function getCountryLabel(code) {
    if (code === "UNKNOWN") {
        return "Unknown / Not reported";
    }

    try {
        return COUNTRY_NAMES.of(code) || code;
    } catch {
        return code;
    }
}

export function ShipFilterFields({ filters, onChange, filterOptions }) {
    const { countryCodes, shipType, maxSpeed, maxLength } = filterOptions;

    const toggleType = (type) => {
        const next = filters.shipTypes.includes(type)
            ? filters.shipTypes.filter((t) => t !== type)
            : [...filters.shipTypes, type];

        onChange({ ...filters, shipTypes: next });
    };

    return (
        <Stack spacing={2}>
            <Typography variant="subtitle2">Ship type</Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
                {shipType.values.map((type) => (
                    <Chip
                        key={type}
                        label={type}
                        size="small"
                        clickable
                        color={filters.shipTypes.includes(type) ? "primary" : "default"}
                        onClick={() => toggleType(type)}
                    />
                ))}
            </Stack>

            <FormControlLabel
                control={
                    <Checkbox
                        checked={filters.onlyMoving}
                        onChange={(e) =>
                            onChange({ ...filters, onlyMoving: e.target.checked })
                        }
                    />
                }
                label="Moving only"
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={filters.onlyViolations}
                        onChange={(e) =>
                            onChange({ ...filters, onlyViolations: e.target.checked })
                        }
                    />
                }
                label="Violations only"
            />

            <Typography variant="subtitle2">Country</Typography>

            <FormControl fullWidth size="small">
                <InputLabel id="country-label">Country</InputLabel>
                <Select
                    labelId="country-label"
                    label="Country"
                    multiple
                    value={filters.countryCodes}
                    renderValue={(selected) => selected.join(", ")}
                    onChange={(e) =>
                        onChange({ ...filters, countryCodes: e.target.value })
                    }
                    MenuProps={{
                        PaperProps: {
                            style: {
                                maxHeight: 250,   // LIMIT HEIGHT
                            },
                        },
                        anchorOrigin: {
                            vertical: "bottom",
                            horizontal: "left",
                        },
                        transformOrigin: {
                            vertical: "top",
                            horizontal: "left",
                        },
                    }}
                >
                    {countryCodes.values.map((code) => (
                        <MenuItem key={code} value={code}>
                            <Checkbox checked={filters.countryCodes.includes(code)} />
                            <ListItemText
                                primary={getCountryLabel(code)}
                                secondary={code !== "UNKNOWN" ? code : null}
                            />
                        </MenuItem>

                    ))}
                </Select>
            </FormControl>

            <Typography variant="caption">Min speed (knots)</Typography>
            <Slider
                size="small"
                min={0}
                max={maxSpeed}
                step={0.5}
                value={filters.minSpeed}
                valueLabelDisplay="auto"
                onChange={(_, v) =>
                    onChange({ ...filters, minSpeed: v })
                }
            />

            <Typography variant="caption">Min length (m)</Typography>
            <Slider
                size="small"
                min={0}
                max={maxLength}
                step={5}
                value={filters.minLength}
                valueLabelDisplay="auto"
                onChange={(_, v) =>
                    onChange({ ...filters, minLength: v })
                }
            />
        </Stack>
    );
}
