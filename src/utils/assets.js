/**
 * Asset URL Helper
 * Resolves asset paths with Vite's base URL for production builds
 */

// Get the base URL from Vite (includes trailing slash)
const BASE_URL = import.meta.env.BASE_URL || '/';

/**
 * Get the full URL for a public asset
 * @param {string} path - Path relative to public folder (e.g., 'images/hero.png')
 * @returns {string} Full URL with base path
 */
export const getAssetUrl = (path) => {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${BASE_URL}${cleanPath}`;
};

/**
 * Get gallery image URL
 * @param {string} filename - Image filename (e.g., 'phone-before.png')
 * @returns {string} Full gallery image URL
 */
export const getGalleryUrl = (filename) => {
    return getAssetUrl(`gallery/${filename}`);
};

export default { getAssetUrl, getGalleryUrl };
