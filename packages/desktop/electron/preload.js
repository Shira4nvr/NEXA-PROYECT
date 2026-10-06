const { contextBridge } = require("electron");

// Aqui expones de forma segura funciones nativas al proceso de React,
// por ejemplo notificaciones del sistema, dialogos de archivo, etc.
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
});
