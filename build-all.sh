#!/bin/bash

echo "🚀 Building Pure Zoom Electron for all platforms..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Build for current platform (macOS)
echo "🍎 Building for macOS..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ macOS build successful!"
    echo "📁 Output: dist/"
    ls -la dist/
else
    echo "❌ macOS build failed!"
    exit 1
fi

echo ""
echo "🎯 Build completed successfully!"
echo "📱 You can now distribute the .dmg file to other macOS devices"
echo ""
echo "💡 To build for other platforms:"
echo "   - Windows: npm run build -- --win"
echo "   - Linux: npm run build -- --linux"
echo "   - All: npm run build -- --win --linux --mac"
