const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

/**
 * Electron ships its own Node.js runtime, so requiring the backend
 * module directly runs it inside THIS process - no separate "node"
 * executable needs to exist on the machine the .exe is installed on.
 * (The previous version used child_process.spawn("node", ...), which
 * only worked on the dev machine because Node happened to be installed
 * there already.)
 */
async function startBackend() {
  const { start } = require(path.join(__dirname, "../backend/server.js"));
  const port = await start(5050);
  return port;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    show: false, // avoid a white flash before content is ready
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../frontend/dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startBackend();
  } catch (err) {
    console.error("Backend failed to start:", err);
    // Still show the window so the user isn't staring at nothing;
    // the frontend will surface "unable to load" errors from its
    // own API calls.
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
