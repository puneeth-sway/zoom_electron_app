// Browser Environment Test Script
// This script tests if we're in a proper browser environment for Zoom Video SDK

console.log("🔍 Testing Browser Environment...\n");

// Test browser APIs
const browserAPIs = {
  window: typeof window !== "undefined",
  navigator: typeof navigator !== "undefined",
  document: typeof document !== "undefined",
  location: typeof location !== "undefined",
  localStorage: typeof localStorage !== "undefined",
  sessionStorage: typeof sessionStorage !== "undefined",
  fetch: typeof fetch !== "undefined",
  XMLHttpRequest: typeof XMLHttpRequest !== "undefined",
  WebSocket: typeof WebSocket !== "undefined",
  MediaDevices: typeof navigator?.mediaDevices !== "undefined",
  getUserMedia: typeof navigator?.mediaDevices?.getUserMedia === "function",
};

console.log("Browser API Availability:");
Object.entries(browserAPIs).forEach(([api, available]) => {
  console.log(`${available ? "✅" : "❌"} ${api}`);
});

// Test Node.js APIs (should not be available in browser)
const nodeAPIs = {
  process: typeof process !== "undefined",
  require: typeof require !== "undefined",
  module: typeof module !== "undefined",
  Buffer: typeof Buffer !== "undefined",
  global: typeof global !== "undefined",
};

console.log("\nNode.js API Availability (should be false in browser):");
Object.entries(nodeAPIs).forEach(([api, available]) => {
  console.log(
    `${available ? "⚠️" : "✅"} ${api} ${
      available
        ? "(available - this might cause issues)"
        : "(not available - good)"
    }`
  );
});

// Test Electron-specific APIs
const electronAPIs = {
  ipcRenderer:
    typeof require !== "undefined" &&
    typeof require("electron")?.ipcRenderer !== "undefined",
  remote:
    typeof require !== "undefined" &&
    typeof require("electron")?.remote !== "undefined",
};

console.log("\nElectron API Availability:");
Object.entries(electronAPIs).forEach(([api, available]) => {
  console.log(`${available ? "✅" : "❌"} ${api}`);
});

// Summary
const browserAPIsAvailable = Object.values(browserAPIs).filter(Boolean).length;
const totalBrowserAPIs = Object.keys(browserAPIs).length;
const nodeAPIsAvailable = Object.values(nodeAPIs).filter(Boolean).length;

console.log(`\n📊 Summary:`);
console.log(
  `Browser APIs: ${browserAPIsAvailable}/${totalBrowserAPIs} available`
);
console.log(
  `Node.js APIs: ${nodeAPIsAvailable} available (should be 0 in pure browser)`
);

if (browserAPIsAvailable === totalBrowserAPIs && nodeAPIsAvailable === 0) {
  console.log("🎉 Perfect browser environment for Zoom Video SDK!");
} else if (browserAPIsAvailable === totalBrowserAPIs) {
  console.log(
    "✅ Good browser environment, but some Node.js APIs are available"
  );
} else {
  console.log(
    "❌ Browser environment incomplete - Zoom Video SDK may not work"
  );
}

console.log("\n💡 This test helps diagnose why Zoom Video SDK might not work");

// Test Zoom Video SDK specifically
console.log("\n🔍 Testing Zoom Video SDK...");
try {
  // Try to load Zoom Video SDK
  const ZoomVideo = require("@zoom/videosdk");
  console.log("✅ Zoom Video SDK loaded successfully");
  console.log("ZoomVideo type:", typeof ZoomVideo);
  console.log("ZoomVideo keys:", Object.keys(ZoomVideo));

  // Check for createClient method
  if (typeof ZoomVideo.createClient === "function") {
    console.log("✅ createClient method found directly");
  } else if (
    ZoomVideo.default &&
    typeof ZoomVideo.default.createClient === "function"
  ) {
    console.log("✅ createClient method found in ZoomVideo.default");
  } else {
    console.log("❌ createClient method not found");

    // Search for it
    for (const key of Object.keys(ZoomVideo)) {
      const value = ZoomVideo[key];
      if (
        value &&
        typeof value === "object" &&
        typeof value.createClient === "function"
      ) {
        console.log(`✅ createClient found in ZoomVideo.${key}`);
        break;
      }
    }
  }
} catch (error) {
  console.log("❌ Could not load Zoom Video SDK:", error.message);
  console.log("   This is expected in Node.js environment");
}
