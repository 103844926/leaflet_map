import { Stack, TextField, InputAdornment, Button } from "@mui/material";
import { Search, FilterAlt, TableRows } from "@mui/icons-material";

export function ShipLayerAction({
    searchQuery,
    onSearchChange,
    onOpenFilter,
    onToggleTable,
}) {
    return (
        <Stack spacing={1.25}>
            <TextField
                size="small"
                placeholder="Search ships..."
                value={searchQuery}
                onChange={onSearchChange}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search fontSize="small" />
                        </InputAdornment>
                    ),
                }}
                sx={{ width: "100%" }}
            />

            <Stack direction="row" spacing={1}>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FilterAlt />}
                    onClick={onOpenFilter}
                    fullWidth
                >
                    Filters
                </Button>

                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<TableRows />}
                    onClick={onToggleTable}
                    fullWidth
                >
                    Data
                </Button>
            </Stack>
        </Stack>
    );
}
