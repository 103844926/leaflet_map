import { WindInfoBox } from './WindInfoBox';
import { WindColorOverlay } from './WindColorOverlay';
import { WindParticleLayer } from './WindParticleLayer';
import { WindParticleExportLayer } from './WindParticleExportLayer';

export function WeatherLayer({ windData, selectedTime, minTime, maxTime, isAnimating, isRecordingActive, isMobile }) {
    if (!windData) return null;

    return (
        <>
            <WindInfoBox
                windData={windData}
                selectedTime={selectedTime}
                minTime={minTime}
                maxTime={maxTime}
                isMobile={isMobile}
                visible={!isRecordingActive}
            />

            {/* Color overlay - always visible */}
            <WindColorOverlay
                windData={windData}
                selectedTime={selectedTime}
                minTime={minTime}
                maxTime={maxTime}
            />

            {/* Live particles (NEVER during recording) */}
            {!isRecordingActive && (
                <WindParticleLayer
                    windData={windData}
                    selectedTime={selectedTime}
                    minTime={minTime}
                    maxTime={maxTime}
                />
            )}

            {/* Export particles (ONLY during recording) */}
            {isRecordingActive && (
                <WindParticleExportLayer
                    windData={windData}
                    selectedTime={selectedTime}
                    minTime={minTime}
                    maxTime={maxTime}
                    enabled
                />
            )}
        </>
    );
}
