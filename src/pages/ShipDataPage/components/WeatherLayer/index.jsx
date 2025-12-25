import { WindInfoBox } from './WindInfoBox';
import { WindColorOverlay } from './WindColorOverlay';
import { WindParticleLayer } from './WindParticleLayer';
import { WindParticleExportLayer } from './WindParticleExportLayer';

export function WeatherLayer({ windData, selectedTime, minTime, maxTime, isAnimating, isRecordingActive }) {
    if (!windData) return null;

    // Hide particles during animation/recording
    const showParticles = !isAnimating && !isRecordingActive;

    return (
        <>
            <WindInfoBox
                windData={windData}
                selectedTime={selectedTime}
                minTime={minTime}
                maxTime={maxTime}
            />

            {/* Color overlay - always visible */}
            <WindColorOverlay
                windData={windData}
                selectedTime={selectedTime}
                minTime={minTime}
                maxTime={maxTime}
            />

            {/* Particle animation - hidden during animation/recording */}
            <WindParticleLayer
                windData={windData}
                selectedTime={selectedTime}
                minTime={minTime}
                maxTime={maxTime}
                visible={showParticles}
            />

            {/* Particle export layer - only during recording */}
            <WindParticleExportLayer
                windData={windData}
                selectedTime={selectedTime}
                minTime={minTime}
                maxTime={maxTime}
                enabled={isRecordingActive}
            />
        </>
    );
}