const { KJUR } = require("jsrsasign");
const path = require("path");

// Try to load configuration file
let config = {};
try {
  config = require("../config.js");
} catch (error) {
  console.warn(
    "Config file not found, using environment variables or defaults"
  );
}

// You'll need to set these environment variables or store them securely
const ZOOM_SDK_KEY =
  config.ZOOM_SDK_KEY || process.env.ZOOM_SDK_KEY || "your_zoom_sdk_key_here";
const ZOOM_SDK_SECRET =
  config.ZOOM_SDK_SECRET ||
  process.env.ZOOM_SDK_SECRET ||
  "your_zoom_sdk_secret_here";

function generateSignature(sessionName, role = 1) {
  if (
    !ZOOM_SDK_KEY ||
    !ZOOM_SDK_SECRET ||
    ZOOM_SDK_KEY === "your_zoom_sdk_key_here"
  ) {
    throw new Error(
      "Missing ZOOM_SDK_KEY or ZOOM_SDK_SECRET. Please set these environment variables."
    );
  }

  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2; // 2 hours expiration

  const oHeader = { alg: "HS256", typ: "JWT" };
  const oPayload = {
    app_key: ZOOM_SDK_KEY,
    tpc: sessionName,
    role_type: role,
    version: 1,
    iat: iat,
    exp: exp,
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  const sdkJWT = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, ZOOM_SDK_SECRET);

  return sdkJWT;
}

module.exports = {
  generateSignature,
};
