import { useState, useMemo } from "react";
import { Cloud, CloudOff, Straighten, Visibility, VisibilityOff } from "@mui/icons-material";

export function useLayerControl() {
    // All visibility states
    const [showWeather, setShowWeather] = useState(true);
    const [showRuler, setShowRuler] = useState(false);
    const [showUI, setShowUI] = useState(true);

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
                id: "ruler",
                icon: <Straighten />,
                tooltip: showRuler ? "Disable Ruler" : "Enable Ruler",
                isVisible: showRuler,
                onToggle: () => setShowRuler(v => !v),
            },
            {
                id: "ui",
                icon: showUI ? <Visibility /> : <VisibilityOff />,
                tooltip: showUI ? "Hide UI Controls" : "Show UI Controls",
                isVisible: showUI,
                onToggle: () => setShowUI(!showUI),
            },
        ],
        [showWeather, showRuler, showUI]
    );

    return {
        // Individual states
        showWeather,
        showRuler,
        showUI,

        // Configuration for LayerControl component
        layerConfigs,
    };
}