# Pure Zoom Electron

A cross-platform Electron application with video call features powered by Zoom Video SDK, similar to Zoom application.

## Features

- 🎥 **Multi-participant video calls** - Join meetings with multiple participants
- 🔐 **Secure meetings** - JWT-based authentication using Zoom Video SDK
- 💬 **Real-time chat** - Built-in chat functionality during calls
- 🖥️ **Screen sharing** - Share your screen with other participants
- 🎤 **Audio/Video controls** - Mute/unmute audio and video
- 🌐 **Cross-platform** - Works on Windows, macOS, and Linux
- 📱 **Responsive design** - Adapts to different screen sizes
- 🚀 **Modern UI** - Beautiful and intuitive user interface

## Prerequisites

Before running this application, you need:

1. **Node.js** (version 16 or higher)
2. **Zoom Video SDK credentials**:
   - Zoom SDK Key
   - Zoom SDK Secret

## Quick Start

If you're experiencing the "ZoomVideo.createClient is not a function" or "navigator is not defined" error:

```bash
# 1. Install all dependencies (including server)
npm run install-all

# 2. Start the signature server
npm run server

# 3. In another terminal, start the Electron app
npm start

# 4. Open DevTools (Ctrl+Shift+I or Cmd+Option+I)

# 5. Copy-paste browser-test.js content into console to test environment

# 6. If browser environment is good, the Zoom Video SDK should work
```

**Important**:

- Zoom Video SDK requires a browser environment and cannot be tested with Node.js commands
- The signature server must be running for the app to work properly
- For multi-device testing, start the server on one machine and Electron apps on multiple devices

## Setup Instructions

### 1. Install Dependencies

**Option A: Automatic Installation (Recommended)**

```bash
# Install all dependencies including server
npm run install-all
```

**Option B: Manual Installation**

```bash
# Install main dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..
```

**Option C: Windows Users**

```bash
# Run the batch file
install-dependencies.bat
```

### 2. Configure Zoom Video SDK

You need to set up your Zoom Video SDK credentials. You can do this in two ways:

#### Option A: Environment Variables (Recommended)

Create a `.env` file in the root directory:

```env
ZOOM_SDK_KEY=your_zoom_sdk_key_here
ZOOM_SDK_SECRET=your_zoom_sdk_secret_here
```

#### Option B: Direct Configuration

Edit `utils/jwtGenerator.js` and replace the placeholder values:

```javascript
const ZOOM_SDK_KEY = "your_actual_zoom_sdk_key";
const ZOOM_SDK_SECRET = "your_actual_zoom_sdk_secret";
```

### 3. Get Zoom Video SDK Credentials

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Sign in with your Zoom account
3. Navigate to "Develop" → "Build App"
4. Choose "Video SDK" app type
5. Fill in the required information
6. Get your SDK Key and SDK Secret from the app credentials

### 4. Run the Application

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

## How to Use

### **Multi-Device Setup (Recommended)**

1. **Start the backend server:**

   ```bash
   npm run server
   ```

2. **On each device, start the Electron app:**

   ```bash
   npm start
   ```

3. **Join the same meeting:**
   - Use the **exact same meeting ID** on all devices
   - Enter different names for each participant
   - All devices will automatically see and hear each other

### Creating a Meeting

1. Enter your name in the "Your Name" field
2. Click "Create Meeting"
3. A random meeting ID will be generated
4. Share this meeting ID with others to join

### Joining a Meeting

1. Enter the meeting ID in the "Meeting ID" field
2. Enter your name in the "Your Name" field
3. Click "Join Meeting"

### During a Call

- **Mute/Unmute Audio**: Click the microphone button
- **Start/Stop Video**: Click the video button
- **Screen Share**: Click the desktop button
- **Chat**: Click the chat button to open/close chat panel
- **Leave Meeting**: Click the red phone button

## Building for Distribution

### Build the Application

```bash
npm run build
```

This will create distributable packages for your platform in the `dist` folder.

### Platform-Specific Builds

```bash
# For macOS
npm run dist -- --mac

# For Windows
npm run dist -- --win

# For Linux
npm run dist -- --linux
```

## Project Structure

```
pure-zoom-electron/
├── main.js                 # Main Electron process
├── index.html             # Main application window
├── styles.css             # Application styles
├── renderer.js            # Renderer process (video call logic)
├── server/                 # Backend signature server
│   ├── signature-server.js # Express server for JWT generation
│   ├── package.json       # Server dependencies
│   └── public/            # Server test interface
├── utils/
│   └── jwtGenerator.js   # Local JWT fallback
├── package.json           # Dependencies and scripts
├── ARCHITECTURE.md        # Multi-device architecture guide
└── README.md             # This file
```

## Technical Details

### Architecture

- **Main Process** (`main.js`): Handles application lifecycle and IPC communication
- **Renderer Process** (`renderer.js`): Manages UI and video call functionality
- **Zoom Video SDK**: Handles real-time communication and media streaming

### Key Technologies

- **Electron**: Cross-platform desktop application framework
- **Zoom Video SDK**: Real-time video communication
- **WebRTC**: Peer-to-peer media streaming
- **JWT**: Secure authentication tokens

### Security Features

- JWT-based authentication
- Secure media streaming
- No persistent storage of sensitive data

## Troubleshooting

### Common Issues

1. **"Missing ZOOM_SDK_KEY or ZOOM_SDK_SECRET"**

   - Ensure you've set up your Zoom credentials correctly
   - Check that your `.env` file is in the root directory

2. **Video/Audio not working**

   - Check that your browser has permission to access camera and microphone
   - Ensure no other applications are using your camera/microphone

3. **Cannot join meetings**

   - Verify your internet connection
   - Check that the meeting ID is correct
   - Ensure your Zoom Video SDK credentials are valid

4. **Build errors**
   - Make sure you have the correct Node.js version
   - Try deleting `node_modules` and running `npm install` again

### Getting Help

If you encounter issues:

1. Check the console for error messages
2. Verify your Zoom Video SDK credentials
3. Ensure all dependencies are properly installed
4. Check that your system meets the minimum requirements

### Zoom Video SDK Specific Issues

The Zoom Video SDK can be tricky to work with in Electron. Here are some specific solutions:

#### **The Real Issue: Browser Environment Required**

The error `navigator is not defined` occurs because **Zoom Video SDK requires a browser environment** with APIs like `navigator`, `window`, `document`, etc. It cannot run in Node.js.

#### **Solution 1: Test Browser Environment in Electron**

```bash
# 1. Start the Electron app
npm start

# 2. Open DevTools (Ctrl+Shift+I or Cmd+Option+I)

# 3. Copy-paste the content of browser-test.js into the console
#    This will test if the browser environment is properly set up
```

#### **Solution 2: Check Electron Configuration**

Ensure your `main.js` has proper webPreferences:

```javascript
webPreferences: {
  nodeIntegration: true,
  contextIsolation: false,
  enableRemoteModule: true,
  webSecurity: false,
  nodeIntegrationInWorker: true,
  experimentalFeatures: true,
  allowRunningInsecureContent: true
}
```

#### **Solution 3: Clean Reinstall (if needed)**

```bash
# Complete clean reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### **Solution 4: Verify SDK Installation**

```bash
# Check if the module exists
npm ls @zoom/videosdk

# Check module structure
ls -la node_modules/@zoom/videosdk/
```

### Getting Help

If you encounter issues:

1. **Run the diagnostic test:**

   ```bash
   npm run test-sdk
   ```

2. **Check the console for detailed error messages**

3. **Verify your Zoom Video SDK credentials**

4. **Ensure all dependencies are properly installed**

5. **Check that your system meets the minimum requirements**

## System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: 100MB free space
- **Network**: Stable internet connection for video calls
- **Hardware**: Webcam and microphone for full functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Powered by [Zoom Video SDK](https://marketplace.zoom.us/docs/sdk/video/introduction/)
- Icons from [Font Awesome](https://fontawesome.com/)

## Support

For support and questions:

- Check the troubleshooting section above
- Review the Zoom Video SDK documentation
- Open an issue on the GitHub repository
