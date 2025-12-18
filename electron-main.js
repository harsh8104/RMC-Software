const { app, BrowserWindow } = require("electron");
const path = require("path");

// Set environment variables for Electron mode
process.env.PORT = process.env.PORT || "5000";
process.env.ELECTRON_MODE = "true";
process.env.NODE_ENV = "production";

let mainWindow;
let backendServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "build", "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "electron-preload.js"),
    },
  });

  // Load the local server URL
  const url = `http://localhost:${process.env.PORT}`;
  mainWindow.loadURL(url);

  // Open DevTools in development mode
  if (process.env.DEV_MODE === "true") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

// Start the Express backend by requiring the server file.
function startBackend() {
  try {
    // Check if frontend build exists
    const fs = require("fs");
    const buildPath = path.join(__dirname, "frontend", "build");

    if (!fs.existsSync(buildPath)) {
      console.warn("⚠️  WARNING: Frontend build folder not found!");
      console.warn("   The app will show an error page.");
      console.warn("   Build the frontend first:");
      console.warn("   1. cd frontend");
      console.warn("   2. npm install");
      console.warn("   3. npm run build");
      console.warn("   Or run: BUILD_INSTALLER.bat");
      console.warn("");
    }

    // Ensure dotenv loads from backend/.env if present
    const dotenv = require("dotenv");
    const envPath = path.join(__dirname, "backend", ".env");
    dotenv.config({ path: envPath });

    // Require the backend server. This will call connectDB() and start listening.
    backendServer = require(path.join(__dirname, "backend", "server.js"));
    console.log("✓ Backend server started on port", process.env.PORT);
  } catch (err) {
    console.error("✗ Failed to start backend:", err);
  }
}

app.on("ready", () => {
  startBackend();
  // Wait for server to start before creating window
  setTimeout(() => {
    createWindow();
  }, 2000);
});

app.on("window-all-closed", function () {
  // Quit when all windows are closed
  app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) createWindow();
});

// Cleanup on quit
app.on("before-quit", () => {
  if (backendServer) {
    console.log("Shutting down backend server...");
  }
});
