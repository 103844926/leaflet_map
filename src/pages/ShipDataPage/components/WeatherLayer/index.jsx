import { WindInfoBox } from './WindInfoBox';
import { WindVelocityLayer } from './WindVelocityLayer';

export function WeatherLayer({ windData, selectedTime, minTime, maxTime }) {
    if (!windData) return null;

    return (
        <>
            <WindInfoBox
                windData={windData}
                selectedTime={selectedTime}
                minTime={minTime}
                maxTime={maxTime}
            />
            <WindVelocityLayer
                windData={windData}
                selectedTime={selectedTime}
                minTime={minTime}
                maxTime={maxTime}
            />
        </>
    );
}