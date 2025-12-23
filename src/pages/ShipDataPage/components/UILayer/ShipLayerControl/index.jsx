// ShipLayerControl/ index.jsx
import { React, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Paper, Typography, Stack, IconButton, Collapse, TextField, InputAdornment, Button } from "@mui/material";
import { ExpandMore, ExpandLess, Search, FilterAlt } from "@mui/icons-material";
import { ShipLayerRow } from "./ShipLayerRow";
import { ShipFilterControl } from "./ShipFilterControl";
import { applyShipFilters } from "@/utils";

export function ShipLayerControl({
    ships,
    visibleShips,
    shipFilters,
    filterOptions,
    onApplyFilters,
    onClearFilters,
    onShipToggle,
    showPaths,
    onPathToggle,
    isAnimatingAll,
    controlRef,
    onJumpToShip,
    onJumpToStartTime,
    movementMarks,
    selectedTime,
    onRecordingShipChange,
    onDialogChange,
}) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const filteredShips = ships.filter(
        (ship) =>
            ship.ship_uid.toLowerCase().includes(searchQuery.toLowerCase()) &&
            applyShipFilters(ship, shipFilters)
    );

    return (
        <Paper
            ref={controlRef}
            sx={{
                position: "fixed",
                bottom: 32,
                left: 32,
                width: 300,
                maxHeight: "80vh",
                overflowY: "auto",
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                zIndex: 1000,
            }}
        >
            {/* HEADER */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ marginBottom: isExpanded ? 2 : 0 }}
            >
                <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: "bold" }}>
                    Ships Control
                </Typography>
                <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
            </Stack>

            {/* BODY */}
            <Collapse in={isExpanded}>
                <Stack spacing={2}>
                    {/* SEARCH BAR */}
                    <TextField
                        size="small"
                        placeholder="Search ships..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: "100%" }}
                    />

                    {/* TOGGLE BACKGROUND SHIPS FILTERS */}
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FilterAlt />}
                        onClick={() => setIsFilterOpen(true)}
                        sx={{ width: "100%" }}
                    >
                        Filters
                    </Button>

                    {/* SHIP LIST */}
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold" }}>
                            Ships ({filteredShips.length})
                        </Typography>

                        {filteredShips.length === 0 ? (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: "12px", py: 2, textAlign: "center" }}
                            >
                                No ships found
                            </Typography>
                        ) : (
                            filteredShips.map((ship) => {
                                const index = ships.findIndex((s) => s.ship_uid === ship.ship_uid);

                                return (
                                    <ShipLayerRow
                                        key={ship.ship_uid}
                                        index={index}
                                        ship={ship}
                                        isVisible={visibleShips[index]}
                                        isAnimatingAll={isAnimatingAll}
                                        onShipToggle={onShipToggle}
                                        onJumpToShip={onJumpToShip}
                                        onJumpToStartTime={onJumpToStartTime}
                                        movementMarks={movementMarks}
                                        onRecordingShipChange={onRecordingShipChange}
                                        onDialogChange={(show, shipStartTime) => onDialogChange(show, shipStartTime)}
                                    />
                                );
                            })
                        )}
                    </Stack>
                </Stack>
            </Collapse>

            <ShipFilterControl
                open={isFilterOpen}
                filters={shipFilters}
                filterOptions={filterOptions}
                onApply={(filters) => {
                    onApplyFilters(filters);
                    setIsFilterOpen(false);
                }}
                onClear={onClearFilters}
                onClose={() => setIsFilterOpen(false)}
            />

        </Paper>
    );
}
