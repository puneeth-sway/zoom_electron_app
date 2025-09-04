const express = require("express");
const cors = require("cors");
const { KJUR } = require("jsrsasign");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Load configuration
let config = {};
try {
  config = require("../config.js");
} catch (error) {
  console.warn("Config file not found, using environment variables");
}

const SDK_KEY =
  config.ZOOM_SDK_KEY || process.env.ZOOM_SDK_KEY || "your_zoom_sdk_key_here";
const SDK_SECRET =
  config.ZOOM_SDK_SECRET ||
  process.env.ZOOM_SDK_SECRET ||
  "your_zoom_sdk_secret_here";

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    sdkConfigured:
      SDK_KEY !== "your_zoom_sdk_key_here" &&
      SDK_SECRET !== "your_zoom_sdk_secret_here",
  });
});

// Generate JWT signature endpoint
app.get("/getSignature", (req, res) => {
  try {
    const { sessionName, role = 0, userName } = req.query;

    // Validation
    if (!sessionName) {
      return res.status(400).json({
        error: "sessionName is required",
        example: "/getSignature?sessionName=MEETING123&role=0&userName=John",
      });
    }

    if (!SDK_KEY || !SDK_SECRET || SDK_KEY === "your_zoom_sdk_key_here") {
      return res.status(500).json({
        error:
          "Zoom Video SDK not configured. Please set ZOOM_SDK_KEY and ZOOM_SDK_SECRET.",
        setup:
          "Run 'npm run setup' or create config.js with your Zoom credentials",
      });
    }

    // Generate JWT payload
    const iat = Math.floor(Date.now() / 1000) - 30; // 30 seconds ago
    const exp = iat + 60 * 60 * 2; // 2 hours from now

    const payload = {
      app_key: SDK_KEY,
      tpc: sessionName,
      role_type: parseInt(role), // 0 = participant, 1 = host
      version: 1,
      iat: iat,
      exp: exp,
    };

    // Generate signature
    const header = { alg: "HS256", typ: "JWT" };
    const signature = KJUR.jws.JWS.sign(
      "HS256",
      JSON.stringify(header),
      JSON.stringify(payload),
      SDK_SECRET
    );

    console.log(
      `Generated signature for session: ${sessionName}, user: ${
        userName || "unknown"
      }, role: ${role}`
    );

    res.json({
      success: true,
      signature: signature,
      sessionName: sessionName,
      role: parseInt(role),
      expiresAt: new Date(exp * 1000).toISOString(),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating signature:", error);
    res.status(500).json({
      error: "Failed to generate signature",
      details: error.message,
    });
  }
});

// Get available sessions (for demo purposes)
app.get("/sessions", (req, res) => {
  // In a real app, you might store active sessions in a database
  res.json({
    activeSessions: [
      { id: "DEMO123", name: "Demo Meeting", participants: 2 },
      { id: "TEAM456", name: "Team Standup", participants: 5 },
    ],
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    available: ["/health", "/getSignature", "/sessions"],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Zoom Video SDK Signature Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Signature endpoint: http://localhost:${PORT}/getSignature`);

  if (
    SDK_KEY === "your_zoom_sdk_key_here" ||
    SDK_SECRET === "your_zoom_sdk_secret_here"
  ) {
    console.log(`⚠️  WARNING: Zoom credentials not configured!`);
    console.log(
      `   Run 'npm run setup' or create config.js with your Zoom credentials`
    );
  } else {
    console.log(`✅ Zoom Video SDK configured successfully`);
  }
});

module.exports = app;
