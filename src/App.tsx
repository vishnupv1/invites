import { type ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Admin } from "./pages/Admin";
import { Auth } from "./pages/Auth";
import { Category } from "./pages/Category";
import { CreateGuest } from "./pages/CreateGuest";
import { Editor } from "./pages/Editor";
import { Home } from "./pages/Home";
import { InvitePage } from "./pages/InvitePage";
import { Brand } from "./components/Brand";
import { PageMeta } from "./lib/seo";
import { Studio } from "./pages/Studio";
import { TemplatePage } from "./pages/TemplatePage";
import { Spinner } from "./components/Loader";
import { OpenInvite } from "./pages/OpenInvite";
import { TemplatePreview } from "./pages/TemplatePreview";
import { AllTemplates } from "./pages/AllTemplates";
import { Templates } from "./pages/Templates";
import { Contact, Privacy, Refunds, Terms } from "./pages/Legal";
import { Unauthorized } from "./pages/Unauthorized";
import { useSession } from "./session";

function RequireAccount({ children }: { children: ReactNode }) {
  const { ready, signedIn } = useSession();
  const location = useLocation();
  if (!ready) return <div className="acct-wait" aria-busy="true" aria-label="Loading"><Spinner size="md" /></div>;
  if (!signedIn) {
    return <Navigate to="/unauthorized" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return children;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="nav">
        <Brand />
        <nav>
          <Link to="/occasions">Celebrations</Link>
          <Link to="/browse">Templates</Link>
          <Link to="/studio">Dashboard</Link>
        </nav>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}

export default function App() {
  return (
    <>
      <PageMeta />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how" element={<Home focus="how" />} />
        <Route path="/features" element={<Home focus="features" />} />
        <Route path="/pricing" element={<Home focus="pricing" />} />
        <Route path="/faq" element={<Home focus="faq" />} />
        <Route path="/occasions" element={<Home focus="occasions" />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refunds" element={<Refunds />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/browse" element={<AllTemplates />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/templates" element={<RequireAccount><Templates /></RequireAccount>} />
        <Route path="/preview/:id" element={<TemplatePreview />} />
        <Route path="/open/:id" element={<OpenInvite />} />
        <Route
          path="/c/:id"
          element={
            <Shell>
              <Category />
            </Shell>
          }
        />
        <Route path="/template/:id" element={<TemplatePage />} />
        <Route path="/create" element={<CreateGuest />} />
        <Route path="/create/:id" element={<Editor />} />
        <Route path="/studio" element={<RequireAccount><Studio view="dashboard" /></RequireAccount>} />
        <Route path="/events" element={<RequireAccount><Studio view="events" /></RequireAccount>} />
        <Route path="/guests" element={<RequireAccount><Studio view="guests" /></RequireAccount>} />
        <Route path="/purchases" element={<RequireAccount><Studio view="purchases" /></RequireAccount>} />
        <Route path="/i/:code" element={<InvitePage />} />
      </Routes>
    </>
  );
}
