import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getHost, getToken, onSessionChange, type Host } from "./api";

type Phase = "checking" | "in" | "out";

type SessionValue = {
  ready: boolean;
  host: Host | null;
  signedIn: boolean;
};

const SessionContext = createContext<SessionValue>({ ready: false, host: null, signedIn: false });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<Host | null>(null);
  const [phase, setPhase] = useState<Phase>(() => (getToken() ? "checking" : "out"));

  useEffect(() => {
    let cancel = false;

    async function load() {
      const token = getToken();
      if (!token) {
        if (cancel) return;
        setHost(null);
        setPhase("out");
        return;
      }
      try {
        const person = await getHost();
        if (cancel || getToken() !== token) return;
        setHost(person);
        setPhase("in");
      } catch {
        if (cancel) return;
        if (!getToken()) {
          setHost(null);
          setPhase("out");
          return;
        }
        setPhase("in");
      }
    }

    void load();
    const stop = onSessionChange(() => {
      void load();
    });
    function onStorage(event: StorageEvent) {
      if (event.key === "invitesready.token.v1") void load();
    }
    window.addEventListener("storage", onStorage);
    return () => {
      cancel = true;
      stop();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <SessionContext.Provider value={{ ready: phase !== "checking", host, signedIn: phase !== "out" }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
