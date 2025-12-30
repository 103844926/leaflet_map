import { useState, useMemo } from "react";
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Typography, IconButton, Stack, Tooltip, TextField, InputAdornment } from "@mui/material";
import { Close, MyLocation, Search } from "@mui/icons-material";

const ROWS_PER_PAGE = 10;

// ✅ Add country name lookup utility
const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

function getCountryLabel(code) {
    if (!code || code === "UNKNOWN") {
        return "Unknown";
    }

    try {
        return COUNTRY_NAMES.of(code) || code;
    } catch {
        return code;
    }
}

export function ShipInfoTable({
    ships,
    selectedShip,
    onSelectShip,
    onClose,
}) {
    const [page, setPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    // ✅ Filter ships based on search query
    const filteredShips = useMemo(() => {
        if (!searchQuery.trim()) return ships;

        const query = searchQuery.toLowerCase();
        return ships.filter((ship) => {
            const name = String(ship.name || '').toLowerCase();
            const type = String(ship.ship_type || '').toLowerCase();
            const code = String(ship.country_code || '').toLowerCase();
            const countryName = getCountryLabel(ship.country_code).toLowerCase();
            const status = String(ship.status || '').toLowerCase();
            const speed = String(ship.speed || '');

            return (
                name.includes(query) ||
                type.includes(query) ||
                code.includes(query) ||
                countryName.includes(query) ||
                status.includes(query) ||
                speed.includes(query)
            );
        });
    }, [ships, searchQuery]);

    // ✅ Reset page when search changes
    useMemo(() => {
        setPage(0);
    }, [searchQuery]);

    const pagedShips = useMemo(() => {
        const start = page * ROWS_PER_PAGE;
        return filteredShips.slice(start, start + ROWS_PER_PAGE);
    }, [filteredShips, page]);

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
                    overflow: "hidden",
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
                        Ship Data ({filteredShips.length}{filteredShips.length !== ships.length && ` of ${ships.length}`})
                    </Typography>

                    <IconButton onClick={onClose}>
                        <Close />
                    </IconButton>
                </Stack>

                {/* ---------- SEARCH BAR ---------- */}
                <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by name, type, country, status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* ---------- TABLE ---------- */}
                <TableContainer sx={{ flex: 1, minHeight: 0 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Length</TableCell>
                                <TableCell>Width</TableCell>
                                <TableCell>Country</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="center" sx={{ width: 80 }}>Action</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {pagedShips.map((ship) => {
                                const isSelected =
                                    selectedShip?.ship_uid === ship.ship_uid;

                                return (
                                    <TableRow
                                        key={ship.ship_uid}
                                        hover
                                        selected={isSelected}
                                        sx={{
                                            cursor: "default",
                                            "&.Mui-selected": {
                                                backgroundColor: "rgba(25, 118, 210, 0.08)",
                                            },
                                            "&.Mui-selected:hover": {
                                                backgroundColor: "rgba(25, 118, 210, 0.12)",
                                            },
                                        }}
                                    >
                                        <TableCell>{ship.name}</TableCell>
                                        <TableCell>{ship.ship_type}</TableCell>
                                        <TableCell>{ship.length}</TableCell>
                                        <TableCell>{ship.width}</TableCell>
                                        <TableCell>
                                            {/* ✅ Display country name with code as smaller text */}
                                            <Box>
                                                <Typography variant="body2">
                                                    {getCountryLabel(ship.country_code)}
                                                </Typography>
                                                {ship.country_code && ship.country_code !== "UNKNOWN" && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {ship.country_code}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{ship.status}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Jump to ship location">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectShip(ship);
                                                    }}
                                                >
                                                    <MyLocation fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {pagedShips.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        align="center"
                                        sx={{ py: 4 }}
                                    >
                                        {searchQuery ? "No ships match your search" : "No ships available"}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ---------- PAGINATION ---------- */}
                <TablePagination
                    component="div"
                    count={filteredShips.length}
                    rowsPerPage={ROWS_PER_PAGE}
                    page={page}
                    rowsPerPageOptions={[ROWS_PER_PAGE]}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    sx={{
                        borderTop: "1px solid #ddd",
                        flexShrink: 0,
                    }}
                />
            </Paper>
        </Box>
    );
}