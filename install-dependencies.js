#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Installing Pure Zoom Electron Dependencies...\n");

try {
  // Check if package.json exists
  if (!fs.existsSync("package.json")) {
    console.error(
      "❌ package.json not found. Please run this script from the project root."
    );
    process.exit(1);
  }

  // Install main dependencies
  console.log("📦 Installing main dependencies...");
  execSync("npm install", { stdio: "inherit" });
  console.log("✅ Main dependencies installed\n");

  // Check if server directory exists
  if (fs.existsSync("server")) {
    console.log("🔧 Installing server dependencies...");

    // Check if server has its own package.json
    if (fs.existsSync("server/package.json")) {
      console.log(
        "📦 Installing server dependencies from server/package.json..."
      );
      execSync("cd server && npm install", { stdio: "inherit" });
      console.log("✅ Server dependencies installed\n");
    } else {
      console.log("⚠️  Server directory exists but no package.json found");
    }
  } else {
    console.log("⚠️  Server directory not found");
  }

  // Check if config.js exists
  if (!fs.existsSync("config.js")) {
    console.log(
      "\n⚠️  No config.js found. You need to set up Zoom credentials."
    );
    console.log("   Run: npm run setup");
  } else {
    console.log("\n✅ Configuration file found");
  }

  console.log("\n🎉 All dependencies installed successfully!");
  console.log("\n📋 Next steps:");
  console.log(
    "   1. Run: npm run setup (if you haven't configured Zoom credentials)"
  );
  console.log("   2. Run: npm run server (to start the signature server)");
  console.log(
    "   3. Run: npm start (in another terminal to start Electron app)"
  );
  console.log("\n💡 For multi-device testing:");
  console.log("   - Start server on one machine");
  console.log("   - Start Electron app on multiple devices");
  console.log("   - Use the same meeting ID on all devices");
} catch (error) {
  console.error("\n❌ Error installing dependencies:", error.message);
  console.log("\n🔧 Try running manually:");
  console.log("   npm install");
  console.log("   cd server && npm install");
  process.exit(1);
}
