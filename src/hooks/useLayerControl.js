import { useState, useMemo } from "react";
import { Cloud, CloudOff, Visibility, VisibilityOff, Straighten } from "@mui/icons-material";

export function useLayerControl() {
    // All visibility states
    const [showWeather, setShowWeather] = useState(true);
    const [showUI, setShowUI] = useState(true);
    const [showRuler, setShowRuler] = useState(false);

    // Layer configurations
    const layerConfigs = useMemo(
        () => [
            {
                id: "weather",
                icon: showWeather ? <Cloud /> : <CloudOff />,
                tooltip: showWeather ? "Hide Weather" : "Show Weather",
                isVisible: showWeather,
                onToggle: () => setShowWeather(!showWeather),
            },
            {
                id: "ui",
                icon: showUI ? <Visibility /> : <VisibilityOff />,
                tooltip: showUI ? "Hide UI Controls" : "Show UI Controls",
                isVisible: showUI,
                onToggle: () => setShowUI(!showUI),
            },
            {
                id: "ruler",
                icon: <Straighten />,
                tooltip: showRuler ? "Disable Ruler" : "Enable Ruler",
                isVisible: showRuler,
                onToggle: () => setShowRuler(v => !v),
            },
        ],
        [showWeather, showUI, showRuler]
    );

    return {
        // Individual states (if needed elsewhere)
        showWeather,
        showUI,
        showRuler,

        // Configuration for LayerControl component
        layerConfigs,
    };
}