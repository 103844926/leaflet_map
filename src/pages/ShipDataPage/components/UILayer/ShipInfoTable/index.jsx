import { Box, Paper, Pagination, Typography, IconButton, Stack, CircularProgress, Select, MenuItem, FormControl } from "@mui/material";
import { Close } from "@mui/icons-material";

import { ShipAdvancedFilters } from "./ShipAdvancedFilters";
import { ShipDataTable } from "./ShipDataTable";
import { useShipTableFilter } from "@/hooks";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]; // Available page sizes

export function ShipInfoTable({
    isMobile,
    selectedShip,
    onSelectShip,
    onClose,
}) {

    const {
        ships,
        pagination,
        loading,
        error,
        page,
        pageSize,
        typeOptions,
        countryOptions,
        appliedSearch,
        appliedFilters,
        applyFilters,
        clearFilters,
        changePage,
        changePageSize,
    } = useShipTableFilter();

    return (
        <Box
            sx={{
                position: "fixed",
                inset: 0,
                zIndex: 1400,
                backgroundColor: "rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 2,
            }}
            onClick={onClose}
        >
            <Paper
                sx={{
                    width: "min(1200px, 90vw)",
                    maxHeight: "80vh",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 2,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ---------- HEADER ---------- */}
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ px: 2, py: 1.25, borderBottom: "1px solid #ddd" }}
                >
                    <Typography variant="h6">
                        Ship Data (
                        {pagination.total?.toLocaleString() || 0}
                        {pagination.total !== pagination.total_unfiltered &&
                            ` out of ${pagination.total_unfiltered?.toLocaleString() || 0}`
                        }
                        )
                    </Typography>

                    <IconButton onClick={onClose}>
                        <Close />
                    </IconButton>
                </Stack>

                {/* ---------- SEARCH & FILTERS ---------- */}
                <ShipAdvancedFilters
                    appliedSearch={appliedSearch}
                    appliedFilters={appliedFilters}
                    onApply={applyFilters}
                    onClear={clearFilters}
                    typeOptions={typeOptions}
                    countryOptions={countryOptions}
                    isMobile={isMobile}
                />

                {/* ---------- LOADING/ERROR STATES ---------- */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Box sx={{ px: 2, py: 2 }}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                )}

                {/* ---------- TABLE ---------- */}
                {!loading && !error && (
                    <ShipDataTable
                        ships={ships}
                        selectedShip={selectedShip}
                        onSelectShip={onSelectShip}
                        hasResults={ships.length > 0}
                    />
                )}

                {/* ---------- PAGINATION ---------- */}
                <Box
                    sx={{
                        borderTop: "1px solid #ddd",
                        py: 1.5,
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        px: 2,
                    }}
                >
                    {/* Page Size Selector */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                            Rows per page:
                        </Typography>
                        <FormControl size="small">
                            <Select
                                value={pageSize}
                                onChange={(e) => changePageSize(e.target.value)}
                                disabled={loading}
                                sx={{ minWidth: 80 }}
                                MenuProps={{
                                    sx: { zIndex: 1500 } // Higher than modal (1400)
                                }}
                            >
                                {PAGE_SIZE_OPTIONS.map(size => (
                                    <MenuItem key={size} value={size}>
                                        {size}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography variant="body2" color="text.secondary">
                            {pagination.total > 0
                                ? `${((page - 1) * pageSize) + 1}-${Math.min(page * pageSize, pagination.total)} of ${pagination.total.toLocaleString()}`
                                : '0 results'}
                        </Typography>
                    </Stack>

                    {/* Pagination Controls */}
                    <Pagination
                        size={isMobile ? "small" : "medium"}
                        count={pagination.totalPages}
                        page={page}
                        siblingCount={isMobile ? 1 : 2}
                        onChange={(_, p) => changePage(p)}
                        color="primary"
                        disabled={loading}
                    />
                </Box>
            </Paper>
        </Box>
    );
}