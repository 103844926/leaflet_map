/**
 * Shared utilities for responsive design across info boxes
 */

// Mobile breakpoint (in pixels)
export const MOBILE_BREAKPOINT = 600; // MUI mobile breakpoint (sm)

/**
 * Check if current viewport is mobile size
 * @returns {boolean}
 */
export const isMobileViewport = () => {
    return window.innerWidth < MOBILE_BREAKPOINT;
};

/**
 * Get responsive styles for info boxes
 * @param {boolean} isMobile - Whether viewport is mobile
 * @returns {object} Style configuration
 */
export const getInfoBoxStyles = (isMobile) => ({
    padding: isMobile ? 1 : 2,
    width: isMobile ? "150px" : "260px",
    fontSize: isMobile ? "0.7rem" : "0.875rem",
    smallFontSize: isMobile ? "0.65rem" : "0.75rem",
    borderRadius: 2,
    background: "rgba(255,255,255,0.95)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
});

/**
 * Format coordinates based on viewport size
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {boolean} isMobile - Whether viewport is mobile
 * @returns {string} Formatted coordinate string
 */
export const formatCoordinates = (lat, lng, isMobile) => {
    const precision = isMobile ? 2 : 4;
    return `${lat?.toFixed(precision)}, ${lng?.toFixed(precision)}`;
};

/**
 * Get responsive Typography variant
 * @param {string} variant - Base variant (e.g., 'h6', 'body1')
 * @param {boolean} isMobile - Whether viewport is mobile
 * @returns {string} Responsive variant
 */
export const getResponsiveVariant = (variant, isMobile) => {
    const variantMap = {
        h6: isMobile ? "subtitle2" : "h6",
        body1: isMobile ? "body2" : "body1",
        body2: "body2",
    };

    return variantMap[variant] || variant;
};
