@echo off
echo 🚀 Installing Pure Zoom Electron Dependencies...
echo.

echo 📦 Installing main dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install main dependencies
    pause
    exit /b 1
)
echo ✅ Main dependencies installed
echo.

if exist server (
    echo 🔧 Installing server dependencies...
    if exist server\package.json (
        echo 📦 Installing server dependencies from server/package.json...
        cd server
        call npm install
        cd ..
        if %errorlevel% neq 0 (
            echo ❌ Failed to install server dependencies
            pause
            exit /b 1
        )
        echo ✅ Server dependencies installed
    ) else (
        echo ⚠️  Server directory exists but no package.json found
    )
) else (
    echo ⚠️  Server directory not found
)

if not exist config.js (
    echo.
    echo ⚠️  No config.js found. You need to set up Zoom credentials.
    echo    Run: npm run setup
) else (
    echo.
    echo ✅ Configuration file found
)

echo.
echo 🎉 All dependencies installed successfully!
echo.
echo 📋 Next steps:
echo    1. Run: npm run setup (if you haven't configured Zoom credentials)
echo    2. Run: npm run server (to start the signature server)
echo    3. Run: npm start (in another terminal to start Electron app)
echo.
echo 💡 For multi-device testing:
echo    - Start server on one machine
echo    - Start Electron app on multiple devices
echo    - Use the same meeting ID on all devices
echo.
pause
