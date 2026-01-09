import React, { useState, useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { Paper, Typography, Stack, IconButton, Collapse, Fab, } from "@mui/material";
import { ExpandMore, ExpandLess, Menu, Close, } from "@mui/icons-material";

import { ShipLayerRow } from "./ShipLayerRow";
import { ShipLayerAction } from "./ShipLayerAction";
import { ShipFilterControl } from "./ShipFilterControl";
import { applyShipFilters } from "@/utils";

export function ShipLayerControl({
    isMobile,
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
    showShipTable,
    onToggleShipTable,
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOpen, setIsOpen] = useState(!isMobile);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        setIsOpen(!isMobile);
    }, [isMobile]);

    const filteredShips = useMemo(
        () =>
            ships.filter(
                (ship) =>
                    ship.ship_uid
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) &&
                    applyShipFilters(ship, shipFilters)
            ),
        [ships, shipFilters, searchQuery]
    );

    const BodyContent = (
        <Stack spacing={1.25}>
            <ShipLayerAction
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                onOpenFilter={() => setIsFilterOpen(true)}
                onToggleTable={onToggleShipTable}
            />

            <Stack spacing={1}>
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontSize: isMobile ? "13px" : "14px",
                        fontWeight: "bold",
                    }}
                >
                    Ships ({filteredShips.length})
                </Typography>

                {filteredShips.length === 0 ? (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            fontSize: "12px",
                            py: 2,
                            textAlign: "center",
                        }}
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
    );

    return (
        <>
            {/* 📱 MOBILE OPEN */}
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

            {/* 📱 MOBILE CLOSE */}
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

            <Paper
                ref={controlRef}
                sx={{
                    position: "fixed",
                    top: isMobile ? 16 : 20,
                    left: isMobile ? 16 : 20,
                    maxWidth: isMobile ? "100%" : 280,
                    maxHeight: isMobile ? "70vh" : "80vh",
                    overflowY: "auto",
                    p: isMobile ? 1 : 1.5,
                    borderRadius: 2,
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
                    <Typography
                        variant="h6"
                        sx={{ fontSize: "14px", fontWeight: "bold" }}
                    >
                        Ships
                    </Typography>

                    {!isMobile && (
                        <IconButton
                            size="small"
                            onClick={() => setIsExpanded((v) => !v)}
                        >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    )}
                </Stack>

                {/* BODY */}
                {isMobile ? (
                    BodyContent
                ) : (
                    <Collapse in={isExpanded}>{BodyContent}</Collapse>
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
