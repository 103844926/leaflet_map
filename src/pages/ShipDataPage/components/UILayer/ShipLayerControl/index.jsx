import React, { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { Paper, Typography, Stack, IconButton, Collapse, TextField, InputAdornment, Button, Fab, useTheme, useMediaQuery } from "@mui/material";
import { ExpandMore, ExpandLess, Search, FilterAlt, Menu, Close } from "@mui/icons-material";

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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [isExpanded, setIsExpanded] = useState(true);
    const [isOpen, setIsOpen] = useState(!isMobile);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        setIsOpen(!isMobile);
    }, [isMobile]);


    const filteredShips = ships.filter(
        (ship) =>
            ship.ship_uid.toLowerCase().includes(searchQuery.toLowerCase()) &&
            applyShipFilters(ship, shipFilters)
    );

    return (
        <>
            {/* 📱 MOBILE FLOATING MENU BUTTON */}
            {isMobile && !isOpen && (
                <Fab
                    size="small"
                    color="primary"
                    onClick={() => setIsOpen(true)}
                    sx={{
                        position: "fixed",
                        top: 16,
                        left: 16,
                        zIndex: 1100,
                    }}
                >
                    <Menu />
                </Fab>
            )}

            {/* 📱 MOBILE FLOATING CLOSE BUTTON */}
            {isMobile && isOpen && (
                <Fab
                    size="small"
                    color="secondary"
                    onClick={() => setIsOpen(false)}
                    sx={{
                        position: "fixed",
                        top: 16,
                        left: 16,
                        zIndex: 1100,
                    }}
                >
                    <Close />
                </Fab>
            )}

            {/* MAIN PANEL */}
            <Paper
                ref={controlRef}
                sx={{
                    position: "fixed",
                    top: isMobile ? 16 : 20,
                    left: isMobile ? 16 : 20,
                    width: "auto",
                    maxWidth: isMobile ? "100%" : 280,
                    maxHeight: isMobile ? "70vh" : "80vh",
                    overflowY: "auto",
                    backgroundColor: "white",
                    padding: isMobile ? "8px" : "12px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                    zIndex: 1000,
                    display: isMobile && !isOpen ? "none" : "block",
                }}
            >
                {/* HEADER */}
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                >
                    <Typography variant="h6" sx={{ fontSize: "14px", fontWeight: "bold" }}>
                        Ships
                    </Typography>

                    {!isMobile && (
                        <IconButton
                            size="small"
                            onClick={() => setIsExpanded(v => !v)}
                        >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    )}
                </Stack>

                {/* BODY */}
                {isMobile ? (
                    <Stack spacing={1.25}>
                        {/* SEARCH */}
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

                        {/* FILTER BUTTON */}
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
                            <Typography
                                variant="subtitle2"
                                sx={{ fontSize: "13px", fontWeight: "bold" }}
                            >
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
                                    const index = ships.findIndex(
                                        (s) => s.ship_uid === ship.ship_uid
                                    );

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
                                            onDialogChange={(show, shipStartTime) =>
                                                onDialogChange(show, shipStartTime)
                                            }
                                        />
                                    );
                                })
                            )}
                        </Stack>
                    </Stack>
                ) : (
                    <Collapse in={isExpanded}>
                        <Stack spacing={1.25}>
                            {/* SEARCH */}
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

                            {/* FILTER BUTTON */}
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
                                <Typography
                                    variant="subtitle2"
                                    sx={{ fontSize: "14px", fontWeight: "bold" }}
                                >
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
                                        const index = ships.findIndex(
                                            (s) => s.ship_uid === ship.ship_uid
                                        );

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
                                                onDialogChange={(show, shipStartTime) =>
                                                    onDialogChange(show, shipStartTime)
                                                }
                                            />
                                        );
                                    })
                                )}
                            </Stack>
                        </Stack>
                    </Collapse>
                )}

                {/* FILTER DIALOG */}
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
        </>
    );
}
