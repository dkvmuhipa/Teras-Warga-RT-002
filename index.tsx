import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ConfirmProvider } from "./context/ConfirmContext";
import "./index.css";

// Register PWA Service Worker (Only in Production mode to prevent Vite HMR dev conflicts)
if (typeof window !== "undefined" && "serviceWorker" in navigator && (import.meta as any).env?.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("PWA Service Worker registered successfully:", registration.scope);
        // Check for updates on every page load
        registration.update();
      })
      .catch((error) => {
        console.error("PWA Service Worker registration failed:", error);
      });
  });

  // Automatically refresh when new service worker takes control (instant auto-update)
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ConfirmProvider>
      <App />
    </ConfirmProvider>
  </React.StrictMode>
);