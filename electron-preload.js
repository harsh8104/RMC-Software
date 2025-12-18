// Preload script - expose a safe API if needed in the future
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => "pong",
});
