import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Tooltip, Box, } from "@mui/material";
import { MyLocation } from "@mui/icons-material";

// Country name lookup utility
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

export function ShipDataTable({
    ships,
    selectedShip,
    onSelectShip,
    hasResults,
    searchQuery,
}) {
    return (
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
                        <TableCell align="center" sx={{ width: 80 }}>
                            Action
                        </TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {ships.map((ship) => {
                        const isSelected = selectedShip?.ship_uid === ship.ship_uid;

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
                                    <Box>
                                        <Typography variant="body2">
                                            {getCountryLabel(ship.country_code)}
                                        </Typography>
                                        {ship.country_code &&
                                            ship.country_code !== "UNKNOWN" && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
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

                    {!hasResults && (
                        <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                {searchQuery
                                    ? "No ships match your search"
                                    : "No ships available"}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}