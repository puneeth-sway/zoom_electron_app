# 🏗️ Multi-Device Zoom Video SDK Architecture

This document explains how multiple devices running the Electron app can join the same video call session using a common meeting key and JWT signatures.

## 🎯 **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Device 1      │    │   Device 2       │    │   Device N      │
│  (Electron)     │    │  (Electron)      │    │  (Electron)     │
│                 │    │                  │    │                 │
│ Meeting ID: ABC │    │ Meeting ID: ABC  │    │ Meeting ID: ABC │
│ User: John      │    │ User: Sarah      │    │ User: Mike      │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Signature Server        │
                    │   (Backend)               │
                    │                           │
                    │ • Generates JWT tokens    │
                    │ • Validates requests      │
                    │ • Manages session keys    │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Zoom Video SDK Cloud    │
                    │                           │
                    │ • Handles WebRTC routing  │
                    │ • Manages media streams   │
                    │ • Provides global CDN     │
                    └───────────────────────────┘
```

## 🔑 **Key Components**

### 1. **Common Session Key (Meeting ID)**

- All devices use the **same session name** (e.g., "TEAM123", "DEMO456")
- This acts as the "room identifier" for the video call
- Multiple devices can join the same session simultaneously

### 2. **Backend Signature Server**

- Generates JWT tokens for each device joining a session
- Ensures security by keeping SDK secrets on the server
- Provides centralized session management
- Handles authentication and authorization

### 3. **Electron Client Apps**

- Each device runs an instance of the Electron application
- Requests JWT signatures from the backend server
- Connects to Zoom Video SDK using the signature
- Handles local media capture and remote stream rendering

### 4. **Zoom Video SDK Cloud**

- Manages all WebRTC connections
- Routes audio/video streams between participants
- Provides global CDN for optimal performance
- Handles session state and participant management

## 🚀 **How It Works**

### **Step 1: Device Joins Session**

```javascript
// User enters meeting ID and name
const meetingId = "TEAM123";
const userName = "John Doe";

// App requests JWT signature from backend
const signature = await getSignatureFromServer(meetingId, userName);
```

### **Step 2: Backend Generates Signature**

```javascript
// Backend creates JWT payload
const payload = {
  app_key: ZOOM_SDK_KEY,
  tpc: meetingId, // Session name
  role_type: 0, // 0 = participant, 1 = host
  version: 1,
  iat: timestamp,
  exp: timestamp + 7200, // 2 hours expiration
};

// Signs with SDK secret
const signature = KJUR.jws.JWS.sign("HS256", header, payload, SDK_SECRET);
```

### **Step 3: Connect to Zoom Video SDK**

```javascript
// Initialize Zoom client
const client = ZoomVideo.createClient();
await client.init("en-US", "Global", { patchJsMedia: true });

// Join session with signature
await client.join(meetingId, signature, userName);

// Start media streams
const mediaStream = client.getMediaStream();
await mediaStream.startAudio();
await mediaStream.startVideo();
```

### **Step 4: Multi-Device Communication**

- All devices with the same meeting ID join the same session
- Zoom Video SDK automatically handles peer discovery
- Audio/video streams are routed between all participants
- Each device renders local video + all remote videos

## 📱 **Multi-Device Scenarios**

### **Scenario 1: Team Meeting**

```
Meeting ID: TEAM123
Participants:
- John (Windows PC)
- Sarah (MacBook)
- Mike (Linux Desktop)
- Lisa (Windows Laptop)
```

### **Scenario 2: Cross-Platform Development**

```
Meeting ID: DEV456
Participants:
- Developer A (macOS)
- Developer B (Windows)
- Developer C (Ubuntu)
- Client (Windows)
```

### **Scenario 3: Remote Support**

```
Meeting ID: SUPPORT789
Participants:
- Support Agent (Windows)
- Customer 1 (Mac)
- Customer 2 (Windows)
- Manager (Linux)
```

## 🔒 **Security Features**

### **JWT Token Security**

- Tokens expire after 2 hours
- Each device gets a unique signature
- Backend validates all requests
- SDK secrets never exposed to clients

### **Session Isolation**

- Different meeting IDs create separate sessions
- No cross-session communication
- Participants only see others in the same session

### **Role-Based Access**

- Host role (role_type: 1) has additional privileges
- Participant role (role_type: 0) for regular users
- Backend can implement custom role logic

## 🛠️ **Implementation Details**

### **Backend Server**

```bash
# Start signature server
npm run server

# Development mode with auto-reload
npm run server:dev
```

### **Electron App**

```bash
# Start Electron app
npm start

# Development mode with DevTools
npm run dev
```

### **API Endpoints**

```
GET /health              - Server health check
GET /getSignature        - Generate JWT signature
GET /sessions            - List active sessions
```

## 📊 **Performance & Scalability**

### **Zoom Video SDK Benefits**

- **Global CDN**: Optimal routing for international users
- **Automatic Scaling**: Handles any number of participants
- **WebRTC Optimization**: Adaptive bitrate and quality
- **Low Latency**: Real-time communication

### **Backend Considerations**

- **Stateless Design**: Easy to scale horizontally
- **Caching**: JWT tokens can be cached
- **Load Balancing**: Multiple server instances
- **Database**: Track active sessions and participants

## 🔧 **Troubleshooting**

### **Common Issues**

1. **"Signature server error"**

   - Check if backend server is running
   - Verify Zoom credentials in config.js
   - Check server logs for errors

2. **"Cannot join meeting"**

   - Ensure meeting ID is exactly the same on all devices
   - Check JWT token expiration
   - Verify network connectivity

3. **"Video not showing"**
   - Check camera permissions
   - Ensure no other apps are using camera
   - Check browser environment in DevTools

### **Debugging Steps**

1. **Test backend server:**

   ```bash
   curl http://localhost:4000/health
   ```

2. **Test signature generation:**

   ```bash
   curl "http://localhost:4000/getSignature?sessionName=TEST123&role=0&userName=Debug"
   ```

3. **Check browser environment:**
   - Open DevTools in Electron
   - Run browser-test.js content
   - Verify all browser APIs are available

## 🚀 **Getting Started**

### **1. Setup Backend**

```bash
# Install dependencies
npm install

# Configure Zoom credentials
npm run setup

# Start signature server
npm run server
```

### **2. Test Backend**

```bash
# Open in browser
http://localhost:4000

# Test signature generation
# Use the web interface to generate test signatures
```

### **3. Start Electron App**

```bash
# In another terminal
npm start

# Join meeting with same ID as other devices
# All devices should see each other
```

### **4. Multi-Device Testing**

- Start app on multiple devices/computers
- Use the same meeting ID on all devices
- Verify participants can see and hear each other
- Test screen sharing and chat functionality

## 💡 **Best Practices**

1. **Meeting ID Format**: Use consistent, memorable IDs (e.g., "TEAM123", "DEMO456")
2. **User Names**: Use real names for better identification
3. **Network**: Ensure stable internet connection on all devices
4. **Testing**: Test with 2-3 devices before scaling up
5. **Monitoring**: Check backend logs for any errors
6. **Security**: Keep Zoom credentials secure and rotate regularly

## 🔮 **Future Enhancements**

- **Session Management**: Track active participants and sessions
- **User Authentication**: Add login system for participants
- **Recording**: Implement call recording functionality
- **Analytics**: Track usage and performance metrics
- **Mobile Support**: Create mobile companion apps
- **Integration**: Connect with calendar and scheduling systems

---

This architecture enables true multi-device video calling where any number of devices can join the same session, just like Zoom, but with your own custom UI and branding!
