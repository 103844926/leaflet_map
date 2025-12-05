import { React, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Paper, Typography, Stack, IconButton, Collapse, TextField, InputAdornment, Button, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { ExpandMore, ExpandLess, Search, Visibility, VisibilityOff, MyLocation, DirectionsBoat, FiberManualRecord } from "@mui/icons-material";

export function ShipLayerControl({
  ships,
  visibleShips,
  onShipToggle,
  showPaths,
  onPathToggle,
  isAnimatingAll,
  controlRef,
  onJumpToShip, // New prop for jumping to ship position
  onJumpToStartTime, // New prop
  movementMarks,      // New prop
  selectedTime,       // New prop
  onRecordingShipChange,   // <-- add this
  onDialogChange,
  showBackgroundShips, // ADD THIS
  onToggleBackgroundShips, // ADD THIS
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEls, setAnchorEls] = useState({});

  // Filter ships based on search query
  const filteredShips = ships.filter((ship) =>
    ship.ship_uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle opening dropdown menu for a specific ship
  const handleMenuOpen = (event, index) => {
    setAnchorEls((prev) => ({ ...prev, [index]: event.currentTarget }));
  };

  // Handle closing dropdown menu
  const handleMenuClose = (index) => {
    setAnchorEls((prev) => ({ ...prev, [index]: null }));
  };

  // Handle individual ship toggle from dropdown
  const handleShipVisibilityToggle = (index) => {
    onShipToggle(index);
    handleMenuClose(index);
  };

  // Handle jump to ship position
  const handleJumpToShip = (index) => {
    if (onJumpToShip) {
      onJumpToShip(index);
    }
    handleMenuClose(index);
  };

  // Handle jump to ship's start time
  const handleJumpToStartTime = (index) => {
    const ship = ships[index];
    const shipMark = movementMarks.find(mark => mark.shipUid === ship.ship_uid);

    if (!shipMark) {
      console.log(`No movement start time found for ${ship.ship_uid}`);
      handleMenuClose(index);
      return;
    }

    if (onJumpToStartTime) {
      onJumpToStartTime(index, shipMark.time);
    }
    handleMenuClose(index);
  };

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
      {/* Header with Collapse Button */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ marginBottom: isExpanded ? 2 : 0 }}
      >
        <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: "bold" }}>
          Ships Control
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ marginLeft: 2 }}
        >
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Stack>

      {/* Collapsible Content */}
      <Collapse in={isExpanded}>
        <Stack spacing={2}>
          {/* Search Bar */}
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

          {/* Toggle Background Ships Button - NEW */}
          <Button
            variant="outlined"
            size="small"
            startIcon={showBackgroundShips ? <VisibilityOff /> : <Visibility />}
            onClick={onToggleBackgroundShips}
            disabled={isAnimatingAll}
            sx={{
              width: "100%",
              borderColor: showBackgroundShips ? "grey.400" : "grey.300",
              color: showBackgroundShips ? "grey.700" : "grey.500",
            }}
          >
            {showBackgroundShips ? "Hide Background Ships" : "Show Background Ships"}
          </Button>

          {/* Ships List */}
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontSize: "14px", fontWeight: "bold" }}>
              Ships ({filteredShips.length})
            </Typography>

            {filteredShips.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px", py: 2, textAlign: "center" }}>
                No ships found
              </Typography>
            ) : (
              filteredShips.map((ship) => {
                const index = ships.findIndex((s) => s.ship_uid === ship.ship_uid);
                const isVisible = visibleShips[index] || false;

                return (
                  <Stack
                    key={ship.ship_uid}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    {/* Ship UID */}
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Button
                        variant="outlined"
                        onClick={(e) => handleMenuOpen(e, index)}
                        disabled={isAnimatingAll}
                        sx={{
                          fontSize: "12px",
                          fontWeight: isVisible ? 500 : 400,
                          padding: "8px 12px",
                          width: "100%",
                          borderRadius: "4px",
                          backgroundColor: isVisible ? "rgba(25, 118, 210, 0.08)" : "transparent",
                          border: "1px solid",
                          borderColor: isVisible ? "primary.main" : "divider",
                          transition: "all 0.2s",
                          "&:hover": {
                            backgroundColor: isVisible ? "rgba(25, 118, 210, 0.12)" : "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        {isVisible ? (
                          <Visibility fontSize="small" color="primary" />
                        ) : (
                          <VisibilityOff fontSize="small" color="disabled" />
                        )}
                        {ship.ship_uid}
                      </Button>
                    </Stack>

                    {/* Dropdown Menu */}
                    <Menu
                      anchorEl={anchorEls[index]}
                      open={Boolean(anchorEls[index])}
                      onClose={() => handleMenuClose(index)}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "left",
                      }}
                    >
                      {/* Show/Hide Ship */}
                      <MenuItem onClick={() => handleShipVisibilityToggle(index)}>
                        <ListItemIcon>
                          {isVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText>{isVisible ? "Hide Ship" : "Show Ship"}</ListItemText>
                      </MenuItem>

                      {/* Jump to Ship Position */}
                      <MenuItem onClick={() => handleJumpToShip(index)} disabled={!isVisible}>
                        <ListItemIcon>
                          <MyLocation fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Jump to Position</ListItemText>
                      </MenuItem>

                      {/* Jump to Start Time */}
                      <MenuItem
                        onClick={() => handleJumpToStartTime(index)} disabled={!isVisible}
                      >
                        <ListItemIcon>
                          <DirectionsBoat fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Jump to Start Time</ListItemText>
                      </MenuItem>

                      {/* Start Ship Record */}
                      <MenuItem
                        onClick={() => {
                          onRecordingShipChange(index);  // choose this ship
                          onDialogChange(true);          // open the recording dialog
                          handleMenuClose(index);
                        }}
                        disabled={!isVisible}
                      >
                        <ListItemIcon>
                          <FiberManualRecord fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText>Record This Ship</ListItemText>
                      </MenuItem>

                    </Menu>
                  </Stack>
                );
              })
            )}
          </Stack>
        </Stack>
      </Collapse>
    </Paper>
  );
}