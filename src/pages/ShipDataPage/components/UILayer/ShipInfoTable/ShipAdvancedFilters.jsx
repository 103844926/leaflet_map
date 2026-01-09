import { useState } from "react";
import { Box, Stack, TextField, Button, Collapse, Autocomplete, InputAdornment } from "@mui/material";
import { Search } from "@mui/icons-material";

const EMPTY_FILTERS = {
    lengthMin: "",
    lengthMax: "",
    widthMin: "",
    widthMax: "",
    type: "",
    country_code: "",
};

export function ShipAdvancedFilters({
    appliedSearch,
    appliedFilters,
    onApply,
    onClear,
    typeOptions = [],
    countryOptions = [],
    isMobile,
}) {
    // Draft state lives here (UI-only, doesn't need persistence)
    const [draftSearch, setDraftSearch] = useState(appliedSearch);
    const [draftFilters, setDraftFilters] = useState(appliedFilters);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleDraftChange = (partial) => {
        setDraftFilters((prev) => ({ ...prev, ...partial }));
    };

    const handleApply = () => {
        onApply(draftSearch, draftFilters);
    };

    const handleClear = () => {
        setDraftSearch("");
        setDraftFilters(EMPTY_FILTERS);
        onClear();
    };

    const safeTypeValue =
        typeOptions.includes(draftFilters.type)
            ? draftFilters.type
            : "";

    const safeCountryValue =
        countryOptions.includes(draftFilters.country_code)
            ? draftFilters.country_code
            : "";

    return (
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            {/* ---------- SEARCH (DRAFT ONLY) ---------- */}
            <TextField
                size="small"
                placeholder="Search by name, type, country, status..."
                fullWidth
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search />
                        </InputAdornment>
                    ),
                }}
            />

            {/* ---------- ACTIONS ---------- */}
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button size="small" onClick={() => setShowAdvanced(v => !v)}>
                    {showAdvanced ? "Hide advanced filters" : "Show advanced filters"}
                </Button>

                <Button size="small" variant="outlined" onClick={handleClear}>
                    Clear
                </Button>

                <Button size="small" variant="contained" onClick={handleApply}>
                    Apply
                </Button>
            </Box>

            {/* ---------- ADVANCED FILTERS ---------- */}
            <Collapse in={showAdvanced}>
                <Stack
                    spacing={2}
                    direction={"row"}
                    flexWrap="wrap"
                    sx={{ mt: 2, pb: 2 }}
                >
                    <Autocomplete
                        size="small"
                        options={["", ...typeOptions]}
                        value={safeTypeValue}
                        onChange={(_, v) => handleDraftChange({ type: v || "" })}
                        getOptionLabel={(o) => (o === "" ? "All" : String(o))}
                        renderInput={(p) => <TextField {...p} label="Ship type" />}
                        disablePortal
                        sx={{ minWidth: 100 }}
                    />

                    <Autocomplete
                        size="small"
                        options={["", ...countryOptions]}
                        value={safeCountryValue}
                        onChange={(_, v) => handleDraftChange({ country_code: v || "" })}
                        getOptionLabel={(o) => (o === "" ? "All" : String(o))}
                        renderInput={(p) => <TextField {...p} label="Country" />}
                        disablePortal
                        sx={{ minWidth: 100 }}
                    />

                    {/* ---------- LENGTH AND WIDTH FILTER (IGNORE FOR NOW)
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Length min"
                            type="number"
                            size="small"
                            value={draftFilters.lengthMin}
                            onChange={(e) =>
                                handleDraftChange({ lengthMin: e.target.value })
                            }
                        />
                        <TextField
                            label="Length max"
                            type="number"
                            size="small"
                            value={draftFilters.lengthMax}
                            onChange={(e) =>
                                handleDraftChange({ lengthMax: e.target.value })
                            }
                        />
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Width min"
                            type="number"
                            size="small"
                            value={draftFilters.widthMin}
                            onChange={(e) =>
                                handleDraftChange({ widthMin: e.target.value })
                            }
                        />
                        <TextField
                            label="Width max"
                            type="number"
                            size="small"
                            value={draftFilters.widthMax}
                            onChange={(e) =>
                                handleDraftChange({ widthMax: e.target.value })
                            }
                        />
                    </Stack>
                    ---------- */}
                </Stack>
            </Collapse>
        </Box>
    );
}