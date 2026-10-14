const { app, BrowserWindow } = require("electron");
const path = require("path");
const { fileURLToPath } = require("url");

const isDev = !app.isPackaged;
const appEntry = path.resolve(__dirname, "../dist/index.html");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    let allowedUrl = false;
    if (isDev) {
      const target = new URL(url);
      allowedUrl = target.origin === "http://localhost:5173";
    } else if (url.startsWith("file://")) {
      allowedUrl = path.resolve(fileURLToPath(url)) === appEntry;
    }
    if (!allowedUrl) event.preventDefault();
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(appEntry);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
