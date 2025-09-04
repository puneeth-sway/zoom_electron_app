const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      nodeIntegrationInWorker: true,
      experimentalFeatures: true,
      allowRunningInsecureContent: true,
    },
    icon: path.join(__dirname, "assets/icon.png"),
    title: "Pure Zoom Electron",
  });

  // Load the index.html file
  mainWindow.loadFile("index.html");

  // Open DevTools in development
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }

  // Log browser environment info for debugging
  console.log("Electron main process started");
  console.log("Node.js version:", process.version);
  console.log("Electron version:", process.versions.electron);
  console.log("Chrome version:", process.versions.chrome);

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for video call functionality
ipcMain.handle("generate-jwt", async (event, sessionName) => {
  try {
    const jwt = require("./utils/jwtGenerator").generateSignature(
      sessionName,
      1
    );
    return jwt;
  } catch (error) {
    console.error("Error generating JWT:", error);
    throw error;
  }
});

ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result.filePaths[0];
});

// Window control handlers
ipcMain.on("minimize-window", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on("maximize-window", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on("close-window", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Handle app quit
app.on("before-quit", () => {
  if (mainWindow) {
    mainWindow.webContents.send("app-quitting");
  }
});
