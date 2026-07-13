import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { TasksProvider } from "./context/TasksContext.jsx";
import { SieveProvider } from "./context/SieveContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <TasksProvider>
          <SieveProvider>
            <App />
          </SieveProvider>
        </TasksProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
