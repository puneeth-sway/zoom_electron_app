// Simple test to understand Zoom Video SDK structure
// Run this in Electron DevTools console

console.log("🔍 Testing Zoom Video SDK Structure...\n");

try {
  // Try to access the Zoom Video SDK
  const ZoomVideo = require("@zoom/videosdk");

  console.log("✅ Zoom Video SDK loaded successfully");
  console.log("ZoomVideo type:", typeof ZoomVideo);
  console.log("ZoomVideo keys:", Object.keys(ZoomVideo));

  // Check for createClient method
  console.log("\n🔍 Looking for createClient method...");

  if (typeof ZoomVideo.createClient === "function") {
    console.log("✅ createClient found directly in ZoomVideo");
  } else {
    console.log("❌ createClient not found directly");
  }

  // Check default export
  if (ZoomVideo.default) {
    console.log("\n📦 Checking default export...");
    console.log("ZoomVideo.default type:", typeof ZoomVideo.default);
    console.log("ZoomVideo.default keys:", Object.keys(ZoomVideo.default));

    if (typeof ZoomVideo.default.createClient === "function") {
      console.log("✅ createClient found in ZoomVideo.default");
    } else {
      console.log("❌ createClient not found in default");
    }
  }

  // Search through all properties
  console.log("\n🔍 Searching all properties for createClient...");
  let found = false;

  for (const key of Object.keys(ZoomVideo)) {
    const value = ZoomVideo[key];
    if (value && typeof value === "object") {
      if (typeof value.createClient === "function") {
        console.log(`✅ createClient found in ZoomVideo.${key}`);
        found = true;
      }
    }
  }

  if (!found) {
    console.log("❌ createClient not found in any property");
  }

  // Try to find any method that might create a client
  console.log("\n🔍 Looking for any client-related methods...");
  const clientMethods = [];

  for (const key of Object.keys(ZoomVideo)) {
    const value = ZoomVideo[key];
    if (
      value &&
      typeof value === "function" &&
      key.toLowerCase().includes("client")
    ) {
      clientMethods.push(key);
      console.log(`📋 Found potential client method: ZoomVideo.${key}`);
    }
  }

  if (clientMethods.length > 0) {
    console.log(
      `\n📋 Found ${clientMethods.length} potential client methods:`,
      clientMethods
    );
  } else {
    console.log("\n❌ No client-related methods found");
  }

  // Check if ZoomVideo itself is a function
  if (typeof ZoomVideo === "function") {
    console.log(
      "\n💡 ZoomVideo is a function - it might be createClient itself!"
    );
    console.log("Try: const client = ZoomVideo();");
  }
} catch (error) {
  console.error("❌ Error testing Zoom Video SDK:", error);
}

console.log("\n💡 Use this information to update the renderer.js file");
