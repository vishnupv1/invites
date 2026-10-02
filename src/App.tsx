import { useEffect, type ReactNode } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { Admin } from "./pages/Admin";
import { Auth } from "./pages/Auth";
import { Category } from "./pages/Category";
import { CreateGuest } from "./pages/CreateGuest";
import { Editor } from "./pages/Editor";
import { Home } from "./pages/Home";
import { InvitePage } from "./pages/InvitePage";
import { Brand } from "./components/Brand";
import { PageMeta } from "./lib/seo";
import { trackPageView } from "./lib/analytics";
import { Studio } from "./pages/Studio";
import { TemplatePage } from "./pages/TemplatePage";
import { OpenInvite } from "./pages/OpenInvite";
import { TemplatePreview } from "./pages/TemplatePreview";
import { AllTemplates } from "./pages/AllTemplates";
import { Templates } from "./pages/Templates";
import { Contact, Privacy, Refunds, Terms } from "./pages/Legal";

function Analytics() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(
      `${location.pathname}${location.search}${location.hash}`,
    );
  }, [location]);

  return null;
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
      <Analytics />
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
        <Route path="/templates" element={<Templates />} />
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
        <Route path="/studio" element={<Studio view="dashboard" />} />
        <Route path="/events" element={<Studio view="events" />} />
        <Route path="/guests" element={<Studio view="guests" />} />
        <Route path="/purchases" element={<Studio view="purchases" />} />
        <Route path="/i/:code" element={<InvitePage />} />
      </Routes>
    </>
  );
}
