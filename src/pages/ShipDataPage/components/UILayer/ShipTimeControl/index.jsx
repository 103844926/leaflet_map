// ShipTimeControl/ShipTimeControl.jsx
import React, { useState, useEffect, useRef } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { ShipTimeControlMobile } from "./ShipTimeControl.mobile";
import { ShipTimeControlDesktop } from "./ShipTimeControl.desktop";

export function ShipTimeControl(props) {
    const {
        isMobile,
        minTime,
        maxTime,
        windowStart,
        windowEnd,
        setWindowStart,
        setWindowEnd,
        isAnimating,
        isRecordingActive,
        onStop,
        onRecordingButtonClick,
    } = props;

    // ---- shared state ----
    const [showRangePicker, setShowRangePicker] = useState(false);
    const [showPlaybackPicker, setPlaybackPicker] = useState(false);

    const [stagingStart, setStagingStart] = useState(null);
    const [stagingEnd, setStagingEnd] = useState(null);

    const playbackRef = useRef(null);

    // ---- sync time bounds ----
    useEffect(() => {
        setStagingStart(minTime);
        setStagingEnd(maxTime);
    }, [minTime, maxTime]);

    // ---- auto close range picker ----
    useEffect(() => {
        if (isAnimating) setShowRangePicker(false);
    }, [isAnimating]);

    const handleRecordingButtonClick = () => {
        if (isRecordingActive) onStop();
        onRecordingButtonClick();
    };

    const sharedProps = {
        ...props,

        windowStart,
        windowEnd,
        setWindowStart,
        setWindowEnd,

        showRangePicker,
        setShowRangePicker,

        showPlaybackPicker,
        setPlaybackPicker,
        playbackRef,

        stagingStart,
        stagingEnd,
        setStagingStart,
        setStagingEnd,

        onRecordingButtonClick: handleRecordingButtonClick,
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            {isMobile ? (
                <ShipTimeControlMobile {...sharedProps} />
            ) : (
                <ShipTimeControlDesktop {...sharedProps} />
            )}
        </LocalizationProvider>
    );
}
