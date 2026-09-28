import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { SessionProvider } from "./session";
import { LibraryProvider } from "./state";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <LibraryProvider>
          <App />
        </LibraryProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
