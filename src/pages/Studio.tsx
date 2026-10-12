import { RsvpDash } from "./RsvpDash";

type AccountView = "events" | "drafts" | "favorites" | "purchases";

export function Studio({ view = "dashboard" }: { view?: "dashboard" | "guests" | "wishes" | "settings" | "templates" | AccountView }) {
  return <RsvpDash mode={view === "dashboard" ? "overview" : view} />;
}
