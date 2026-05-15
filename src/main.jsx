// ============================================================
// main.jsx  React entry point
// AppProvider wraps the entire app so all components can
// access shared state via useApp()
// ============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./context/AppContext";
import App from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);