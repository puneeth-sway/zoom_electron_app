# 🚀 Pure Zoom Electron - Installation Guide

## 📱 **Multi-Device Testing Setup**

### **🎯 Prerequisites:**

- **Server**: One device running the signature server
- **Clients**: Multiple devices with the Electron app installed
- **Network**: All devices must be on the same network or accessible via IP

---

## 🖥️ **Server Setup (Required First)**

### **1. Start the Signature Server:**

```bash
# On the server device
cd /path/to/pure_zoom_electorn
npm run server
```

**Expected Output:**

```
🚀 Signature server starting on port 3000...
✅ Server running at http://localhost:3000
📝 Health check: http://localhost:3000/health
```

### **2. Get Server IP Address:**

```bash
# On macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows
ipconfig | findstr "IPv4"
```

**Note the IP address** (e.g., `192.168.1.100`)

---

## 📱 **Client Installation**

### **macOS Installation:**

1. **Download**: `Pure Zoom Electron-1.0.0-arm64.dmg`
2. **Install**: Double-click the .dmg file
3. **Drag to Applications**: Move the app to Applications folder
4. **First Run**: Right-click → Open (to bypass security)

### **Windows Installation:**

1. **Download**: `Pure Zoom Electron Setup 1.0.0.exe`
2. **Install**: Run the .exe file as Administrator
3. **Follow Setup Wizard**: Choose installation directory
4. **Launch**: Start from Start Menu or Desktop shortcut

### **Linux Installation:**

1. **Download**: `Pure Zoom Electron-1.0.0-arm64.AppImage`
2. **Make Executable**: `chmod +x Pure\ Zoom\ Electron-1.0.0-arm64.AppImage`
3. **Run**: `./Pure\ Zoom\ Electron-1.0.0-arm64.AppImage`

---

## 🔧 **Client Configuration**

### **1. Update Server IP:**

Before joining meetings, update the server IP in the app:

**Option A: Edit renderer.js**

```javascript
// Find this line in renderer.js
const SERVER_URL = "http://localhost:3000";

// Change to your server's IP
const SERVER_URL = "http://192.168.1.100:3000";
```

**Option B: Use Environment Variable**

```bash
# Set environment variable before running
export ZOOM_SERVER_URL="http://192.168.1.100:3000"
npm start
```

### **2. Test Connection:**

1. **Open the app**
2. **Check console** for connection status
3. **Verify server reachable** at `http://[SERVER_IP]:3000/health`

---

## 🎥 **Multi-Device Testing**

### **1. Start Server:**

```bash
# On server device
npm run server
```

### **2. Join Meeting from Multiple Devices:**

1. **Device 1**: Create meeting (Presenter role)
2. **Device 2**: Join meeting (Audience role)
3. **Device 3**: Join meeting (Presenter role)

### **3. Test Features:**

- ✅ **Video Calls**: All participants visible
- ✅ **Role System**: Presenter vs Audience
- ✅ **Background Changes**: Presenter only
- ✅ **Chat**: All participants can chat

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **1. "Failed to join meeting"**

- **Check**: Server is running
- **Check**: Server IP is correct
- **Check**: Network connectivity
- **Check**: Firewall settings

#### **2. "Cannot connect to server"**

- **Verify**: Server IP address
- **Test**: `curl http://[SERVER_IP]:3000/health`
- **Check**: Port 3000 is open

#### **3. "Background changes not working"**

- **Ensure**: Video is ON
- **Check**: User role is Presenter
- **Verify**: Zoom SDK loaded correctly

#### **4. "Black screen for audience"**

- **Check**: Presenter video is ON
- **Verify**: Role assignment is correct
- **Restart**: App on both devices

### **Debug Commands:**

```bash
# Test server connectivity
curl http://[SERVER_IP]:3000/health

# Check network ports
telnet [SERVER_IP] 3000

# View server logs
npm run server
```

---

## 📊 **Testing Checklist**

### **✅ Basic Functionality:**

- [ ] App launches without errors
- [ ] Server connection successful
- [ ] Meeting creation works
- [ ] Meeting joining works

### **✅ Video Features:**

- [ ] Camera access granted
- [ ] Local video displays
- [ ] Remote video displays
- [ ] Audio works

### **✅ Role System:**

- [ ] Presenter can see all participants
- [ ] Audience only sees presenter
- [ ] Role switching works

### **✅ Background Features:**

- [ ] Presenter can change backgrounds
- [ ] Audience cannot access backgrounds
- [ ] Blur effect works
- [ ] Custom images work

### **✅ Multi-Device:**

- [ ] Multiple devices can join
- [ ] All participants visible
- [ ] Chat works across devices
- [ ] Background changes visible to others

---

## 🎯 **Next Steps**

### **1. Test Basic Functionality:**

- Single device testing
- Server connectivity
- Meeting creation/joining

### **2. Test Multi-Device:**

- 2-3 devices on same network
- Different roles (Presenter/Audience)
- Background changes

### **3. Test Advanced Features:**

- Screen sharing
- Chat functionality
- Background effects

### **4. Performance Testing:**

- Multiple participants (5+ devices)
- Long-duration calls
- Network stability

---

## 📞 **Support**

If you encounter issues:

1. **Check console logs** in the app
2. **Verify server status** at `/health` endpoint
3. **Test network connectivity** between devices
4. **Review troubleshooting section** above

**Happy Testing! 🎉**
