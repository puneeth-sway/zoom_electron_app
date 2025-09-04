#!/bin/bash

echo "🚀 Pure Zoom Electron - Quick Start Guide"
echo "=========================================="
echo ""

# Check if server is running
echo "🔍 Checking if server is running..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Server is already running on port 3000"
else
    echo "⚠️  Server is not running"
    echo ""
    echo "📡 Starting signature server..."
    echo "💡 Keep this terminal open for the server"
    echo ""
    npm run server &
    SERVER_PID=$!
    
    # Wait for server to start
    echo "⏳ Waiting for server to start..."
    sleep 3
    
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "✅ Server started successfully!"
    else
        echo "❌ Failed to start server"
        exit 1
    fi
fi

echo ""
echo "🎯 Server Status:"
echo "   Health Check: http://localhost:3000/health"
echo "   Server URL: http://localhost:3000"
echo ""

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
if [ ! -z "$LOCAL_IP" ]; then
    echo "🌐 Your local IP address: $LOCAL_IP"
    echo "   Other devices can connect to: http://$LOCAL_IP:3000"
    echo ""
fi

echo "📱 To test the app:"
echo "   1. Open another terminal"
echo "   2. Run: npm start"
echo "   3. Or install the built app from dist/ folder"
echo ""

echo "🔧 To build for distribution:"
echo "   ./build-all.sh"
echo ""

echo "📖 For detailed instructions, see: INSTALLATION.md"
echo ""

# Keep script running if we started the server
if [ ! -z "$SERVER_PID" ]; then
    echo "🔄 Server is running. Press Ctrl+C to stop..."
    trap "echo '🛑 Stopping server...'; kill $SERVER_PID; exit" INT
    wait $SERVER_PID
fi
