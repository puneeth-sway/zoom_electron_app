@echo off
echo 🚀 Building Pure Zoom Electron for Windows...

REM Clean previous builds
echo 🧹 Cleaning previous builds...
if exist dist rmdir /s /q dist

REM Build for Windows
echo 🪟 Building for Windows...
npm run build -- --win

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Windows build successful!
    echo 📁 Output: dist/
    dir dist
) else (
    echo ❌ Windows build failed!
    pause
    exit /b 1
)

echo.
echo 🎯 Build completed successfully!
echo 📱 You can now distribute the .exe file to other Windows devices
pause
