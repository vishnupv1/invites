import type { ReactNode } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Auth } from "./pages/Auth";
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
          inviesready.com
        </Link>
        <nav>
          <Link to="/#occasions">Celebrations</Link>
          <Link to="/c/marriage">Templates</Link>
          <Link to="/studio">Dashboard</Link>
        </nav>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Auth />} />
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
      <Route path="/studio" element={<Studio />} />
      <Route path="/i/:code" element={<InvitePage />} />
    </Routes>
  );
}
