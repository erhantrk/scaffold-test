import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { WalletProvider } from "./providers/WalletProvider";
import { NotificationProvider } from "./providers/NotificationProvider";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <NotificationProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </NotificationProvider>
  </StrictMode>,
);
