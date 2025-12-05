// ShipLayerMenu.jsx
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { Visibility, VisibilityOff, MyLocation, DirectionsBoat, FiberManualRecord } from "@mui/icons-material";

export function ShipLayerMenu({
    anchorEl,
    onClose,
    isVisible,
    index,
    ship,
    onShipToggle,
    onJumpToShip,
    onJumpToStartTime,
    movementMarks,
    onRecordingShipChange,
    onDialogChange,
}) {
    const handleStartTime = () => {
        const mark = movementMarks.find((m) => m.shipUid === ship.ship_uid);
        if (mark) onJumpToStartTime(index, mark.time);
        onClose();
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={onClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
            {/* SHOW / HIDE */}
            <MenuItem
                onClick={() => {
                    onShipToggle(index);
                    onClose();
                }}
            >
                <ListItemIcon>
                    {isVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </ListItemIcon>
                <ListItemText>{isVisible ? "Hide Ship" : "Show Ship"}</ListItemText>
            </MenuItem>

            {/* JUMP TO POSITION */}
            <MenuItem
                disabled={!isVisible}
                onClick={() => {
                    onJumpToShip(index);
                    onClose();
                }}
            >
                <ListItemIcon>
                    <MyLocation fontSize="small" />
                </ListItemIcon>
                <ListItemText>Jump to Position</ListItemText>
            </MenuItem>

            {/* JUMP TO START TIME */}
            <MenuItem disabled={!isVisible} onClick={handleStartTime}>
                <ListItemIcon>
                    <DirectionsBoat fontSize="small" />
                </ListItemIcon>
                <ListItemText>Jump to Start Time</ListItemText>
            </MenuItem>

            {/* RECORD THIS SHIP */}
            <MenuItem
                disabled={!isVisible}
                onClick={() => {
                    onRecordingShipChange(index);

                    // Find this ship's movement start time
                    const mark = movementMarks.find((m) => m.shipUid === ship.ship_uid);

                    onDialogChange(true, mark?.time); // Pass the start time
                    onClose();
                }}
            >
                <ListItemIcon>
                    <FiberManualRecord fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Record This Ship</ListItemText>
            </MenuItem>
        </Menu>
    );
}
