# 🔧 Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### **1. "Cannot find module 'express'" Error**

**Problem**: When running `npm run server`, you get:

```
Error: Cannot find module 'express'
```

**Cause**: Server dependencies haven't been installed yet.

**Solution**:

```bash
# Option A: Automatic installation (Recommended)
npm run install-all

# Option B: Manual installation
npm install
cd server && npm install && cd ..

# Option C: Windows users
install-dependencies.bat
```

### **2. "ZoomVideo.createClient is not a function" Error**

**Problem**: Electron app shows this error when trying to join a meeting.

**Cause**: Zoom Video SDK not properly loaded in browser environment.

**Solution**:

1. **Check browser environment**:

   ```bash
   # Start Electron app
   npm start

   # Open DevTools (Ctrl+Shift+I or Cmd+Option+I)
   # Copy-paste browser-test.js content into console
   ```

2. **Verify all browser APIs are available**

3. **Check if signature server is running**:
   ```bash
   npm run server
   ```

### **3. "navigator is not defined" Error**

**Problem**: When running Node.js scripts, you get this error.

**Cause**: Zoom Video SDK requires browser environment (navigator, window, document).

**Solution**:

- **Don't test Zoom SDK in Node.js**
- **Only test in Electron app** where browser environment exists
- Use `npm start` to test the app properly

### **4. Signature Server Won't Start**

**Problem**: `npm run server` fails to start.

**Solutions**:

```bash
# Check if port 4000 is available
lsof -i :4000

# Kill process using port 4000 (if needed)
kill -9 <PID>

# Try different port
PORT=4001 npm run server
```

### **5. Cannot Join Meeting**

**Problem**: App starts but can't join video calls.

**Solutions**:

1. **Check signature server is running**:

   ```bash
   curl http://localhost:4000/health
   ```

2. **Verify Zoom credentials**:

   ```bash
   npm run setup
   ```

3. **Check network connectivity**

4. **Verify meeting ID is exactly the same** on all devices

### **6. Video/Audio Not Working**

**Problem**: Can join meeting but no video/audio.

**Solutions**:

1. **Check camera/microphone permissions**
2. **Ensure no other apps are using camera**
3. **Check browser environment in DevTools**
4. **Verify media devices are available**

## 🛠️ **Debugging Steps**

### **Step 1: Check Dependencies**

```bash
# Verify all dependencies are installed
npm ls

# Check server dependencies
cd server && npm ls && cd ..
```

### **Step 2: Test Backend Server**

```bash
# Start server
npm run server

# Test in browser
open http://localhost:4000

# Test with curl
curl http://localhost:4000/health
```

### **Step 3: Test Electron App**

```bash
# Start app
npm start

# Open DevTools
# Run browser environment test
```

### **Step 4: Check Configuration**

```bash
# Verify config.js exists
ls -la config.js

# Check Zoom credentials
cat config.js
```

## 🔍 **Environment Checks**

### **Browser Environment Test**

Run this in Electron DevTools console:

```javascript
// Copy-paste the content of browser-test.js
// This will test all required browser APIs
```

### **Server Health Check**

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "sdkConfigured": true
}
```

### **Signature Generation Test**

```bash
curl "http://localhost:4000/getSignature?sessionName=TEST123&role=0&userName=Debug"
```

## 📱 **Multi-Device Testing**

### **Setup for Multi-Device**

1. **One machine runs the server**:

   ```bash
   npm run server
   ```

2. **Multiple devices run Electron app**:

   ```bash
   npm start
   ```

3. **Use same meeting ID** on all devices

4. **Verify participants can see each other**

### **Common Multi-Device Issues**

1. **Server not accessible from other devices**:

   - Check firewall settings
   - Use server's IP address instead of localhost
   - Update renderer.js with correct server URL

2. **Different meeting IDs**:

   - Ensure exact same meeting ID on all devices
   - Check for typos or extra spaces

3. **Network connectivity**:
   - Verify all devices can reach the server
   - Check for corporate firewalls or VPN issues

## 🚀 **Quick Fix Commands**

### **Complete Reset**

```bash
# Remove all dependencies
rm -rf node_modules package-lock.json
rm -rf server/node_modules server/package-lock.json

# Reinstall everything
npm run install-all
```

### **Server Reset**

```bash
# Kill existing server
pkill -f "signature-server"

# Restart server
npm run server
```

### **App Reset**

```bash
# Kill existing Electron processes
pkill -f "electron"

# Restart app
npm start
```

## 📞 **Getting Help**

If you're still experiencing issues:

1. **Check the console logs** for specific error messages
2. **Run the browser environment test** in DevTools
3. **Verify the signature server is working**
4. **Check your Zoom Video SDK credentials**
5. **Ensure all dependencies are properly installed**

## 🔗 **Useful Commands Reference**

```bash
# Installation
npm run install-all          # Install all dependencies
npm run install-server       # Install only server dependencies

# Server
npm run server               # Start signature server
npm run server:dev          # Start server with auto-reload

# App
npm start                   # Start Electron app
npm run dev                 # Start with DevTools open

# Testing
npm run test-sdk            # Test SDK installation (Node.js)
npm run test-browser        # Instructions for browser testing

# Setup
npm run setup               # Configure Zoom credentials
```

---

**Remember**: The signature server must be running for the Electron app to work properly. Always start the server first, then the app!
