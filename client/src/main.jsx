import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ConfirmacionProvider from "./components/ui/Confirmacion";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfirmacionProvider>
      <App />
    </ConfirmacionProvider>
  </React.StrictMode>
);
