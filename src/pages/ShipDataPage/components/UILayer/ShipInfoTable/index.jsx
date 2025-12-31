import { useState, useMemo, useCallback } from "react";
import { Box, Paper, Pagination, Typography, IconButton, Stack } from "@mui/material";
import { Close } from "@mui/icons-material";

import { ShipAdvancedFilters } from "./ShipAdvancedFilters";
import { ShipDataTable } from "./ShipDataTable";
import { useShipAdvancedFilters } from "@/hooks";

const ROWS_PER_PAGE = 10;

// Custom hook to persist state across mount/unmount cycles
function usePersistedState(key, initialValue) {
    const [state, setState] = useState(() => {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setPersistedState = useCallback((valueOrUpdater) => {
        setState((prev) => {
            const nextValue =
                typeof valueOrUpdater === "function"
                    ? valueOrUpdater(prev)
                    : valueOrUpdater;

            try {
                sessionStorage.setItem(key, JSON.stringify(nextValue));
            } catch (error) {
                console.warn("Failed to save to sessionStorage:", error);
            }

            return nextValue;
        });
    }, [key]);

    return [state, setPersistedState];
}

const EMPTY_FILTERS = {
    lengthMin: "",
    lengthMax: "",
    widthMin: "",
    widthMax: "",
    type: "",
    status: "",
};

export function ShipInfoTable({
    isMobile,
    ships,
    selectedShip,
    onSelectShip,
    onClose,
}) {
    // Only persist applied state (what's actually filtering the data)
    const [page, setPage] = usePersistedState('shipTable_page', 1);
    const [appliedSearch, setAppliedSearch] = usePersistedState('shipTable_search', '');
    const [appliedFilters, setAppliedFilters] = usePersistedState('shipTable_filters', EMPTY_FILTERS);

    // Get filtered ships from pure hook
    const filteredShips = useShipAdvancedFilters(ships, appliedSearch, appliedFilters);

    // Extract unique options for filters
    const typeOptions = useMemo(
        () =>
            [...new Set(ships.map((s) => s.ship_type).filter(Boolean))]
                .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })),
        [ships]
    );

    const statusOptions = useMemo(
        () =>
            [...new Set(ships.map((s) => s.status).filter(Boolean))]
                .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true })),
        [ships]
    );

    // Apply filters handler
    const handleApplyFilters = useCallback((search, filters) => {
        setAppliedSearch(search);
        setAppliedFilters(filters);
        setPage(1); // Reset to first page when filters change
    }, [setAppliedSearch, setAppliedFilters, setPage]);

    // Clear filters handler
    const handleClearFilters = useCallback(() => {
        setAppliedSearch("");
        setAppliedFilters(EMPTY_FILTERS);
        setPage(1);
    }, [setAppliedSearch, setAppliedFilters, setPage]);

    // Adjust page if current page exceeds total pages
    const totalPages = Math.max(1, Math.ceil(filteredShips.length / ROWS_PER_PAGE));
    const adjustedPage = Math.min(page, totalPages);

    // Paginate filtered results
    const pagedShips = useMemo(() => {
        const start = (adjustedPage - 1) * ROWS_PER_PAGE;
        return filteredShips.slice(start, start + ROWS_PER_PAGE);
    }, [filteredShips, adjustedPage]);

    // Clear persisted state on manual close (optional)
    const handleClose = useCallback(() => {
        // Uncomment if you want to clear state on close:
        // sessionStorage.removeItem('shipTable_page');
        // sessionStorage.removeItem('shipTable_search');
        // sessionStorage.removeItem('shipTable_filters');
        onClose();
    }, [onClose]);

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
            onClick={handleClose}
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
                        Ship Data ({filteredShips.length}
                        {filteredShips.length !== ships.length && ` of ${ships.length}`})
                    </Typography>

                    <IconButton onClick={handleClose}>
                        <Close />
                    </IconButton>
                </Stack>

                {/* ---------- SEARCH & FILTERS ---------- */}
                <ShipAdvancedFilters
                    appliedSearch={appliedSearch}
                    appliedFilters={appliedFilters}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                    typeOptions={typeOptions}
                    statusOptions={statusOptions}
                    isMobile={isMobile}
                />

                {/* ---------- TABLE ---------- */}
                <ShipDataTable
                    ships={pagedShips}
                    selectedShip={selectedShip}
                    onSelectShip={onSelectShip}
                    hasResults={pagedShips.length > 0}
                />

                {/* ---------- PAGINATION ---------- */}
                <Box
                    sx={{
                        borderTop: "1px solid #ddd",
                        py: 1.5,
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <Pagination
                        size={isMobile ? "small" : "medium"}
                        count={totalPages}
                        page={adjustedPage}
                        siblingCount={isMobile ? 1 : 2}
                        onChange={(_, newPage) => setPage(newPage)}
                        color="primary"
                    />
                </Box>
            </Paper>
        </Box>
    );
}