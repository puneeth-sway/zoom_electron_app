// Example configuration file for Zoom Video SDK
// Copy this file to config.js and fill in your actual credentials

module.exports = {
  // Zoom Video SDK Credentials
  // Get these from https://marketplace.zoom.us/
  // Navigate to "Develop" → "Build App" → "Video SDK"

  ZOOM_SDK_KEY: "your_zoom_sdk_key_here",
  ZOOM_SDK_SECRET: "your_zoom_sdk_secret_here",

  // Optional: Set to true to enable debug logging
  DEBUG: false,

  // Optional: Customize JWT token expiration (in seconds)
  JWT_EXPIRATION: 7200, // 2 hours
};
