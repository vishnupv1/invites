import type { ReactNode } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Category } from "./pages/Category";
import { Editor } from "./pages/Editor";
import { Home } from "./pages/Home";
import { InvitePage } from "./pages/InvitePage";
import { Studio } from "./pages/Studio";
import { TemplatePage } from "./pages/TemplatePage";

function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="nav">
        <Link className="wordmark" to="/">
          Vellum
        </Link>
        <nav>
          <a href="/#categories">Celebrations</a>
          <Link to="/c/marriage">Wedding styles</Link>
          <Link to="/studio">Studio</Link>
        </nav>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Shell>
            <Home />
          </Shell>
        }
      />
      <Route
        path="/c/:id"
        element={
          <Shell>
            <Category />
          </Shell>
        }
      />
      <Route
        path="/template/:id"
        element={
          <Shell>
            <TemplatePage />
          </Shell>
        }
      />
      <Route
        path="/create/:id"
        element={
          <Shell>
            <Editor />
          </Shell>
        }
      />
      <Route
        path="/studio"
        element={
          <Shell>
            <Studio />
          </Shell>
        }
      />
      <Route path="/i/:code" element={<InvitePage />} />
    </Routes>
  );
}
