import { LoggedInChrome } from "./LoggedInChrome";

export function AppMenu(_props: { current?: string; name?: string; signedIn?: boolean }) {
  return <LoggedInChrome />;
}
