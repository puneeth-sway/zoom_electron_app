#!/usr/bin/env node

console.log("🔍 Testing Zoom Video SDK Installation...\n");

try {
  console.log("1. Checking package.json for @zoom/videosdk...");
  const packageJson = require("./package.json");
  const zoomVersion = packageJson.dependencies["@zoom/videosdk"];
  console.log("Zoom Video SDK version in package.json:", zoomVersion);

  console.log("\n2. Checking node_modules...");
  const fs = require("fs");
  const path = require("path");
  const nodeModulesPath = path.join(
    __dirname,
    "node_modules",
    "@zoom",
    "videosdk"
  );

  if (fs.existsSync(nodeModulesPath)) {
    console.log("✅ @zoom/videosdk found in node_modules");

    const packagePath = path.join(nodeModulesPath, "package.json");
    if (fs.existsSync(packagePath)) {
      const zoomPackage = require(packagePath);
      console.log("Installed version:", zoomPackage.version);
      console.log("Main entry point:", zoomPackage.main);
      console.log("Browser compatibility:", zoomPackage.browser);
    }
  } else {
    console.log("❌ @zoom/videosdk NOT found in node_modules");
  }

  console.log("\n3. Important Note:");
  console.log("⚠️  Zoom Video SDK cannot be tested in Node.js environment");
  console.log("   It requires browser APIs (navigator, window, etc.)");
  console.log(
    "   The SDK will only work properly in Electron renderer process"
  );

  console.log("\n4. To test the SDK, run the Electron app:");
  console.log("   npm start");
} catch (error) {
  console.error("❌ Error:", error.message);
}

console.log("\n📋 Test completed.");
console.log("\n💡 Next step: Run 'npm start' to test in Electron environment");
