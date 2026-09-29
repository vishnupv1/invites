import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { listInvites, listPurchases, purchaseTemplate } from "./api";
import { useSession } from "./session";
import type { SavedInvite } from "./types";

type Library = {
  owned: string[];
  invites: SavedInvite[];
  ready: boolean;
  owns: (id: string, free: boolean) => boolean;
  purchase: (id: string, coupon?: string) => Promise<void>;
  remember: (invite: SavedInvite) => void;
};

const LibraryContext = createContext<Library | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { ready: sessionReady, signedIn, host } = useSession();
  const [owned, setOwned] = useState<string[]>([]);
  const [invites, setInvites] = useState<SavedInvite[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionReady) return;
    if (!signedIn) {
      setOwned([]);
      setInvites([]);
      setReady(true);
      return;
    }
    let cancel = false;
    setReady(false);
    Promise.all([listPurchases(), listInvites()])
      .then(([purchased, published]) => {
        if (cancel) return;
        setOwned(purchased);
        setInvites(published);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [sessionReady, signedIn, host?.id]);

  const library = useMemo<Library>(
    () => ({
      owned,
      invites,
      ready,
      owns: (id, free) => free || owned.includes(id),
      purchase: async (id, coupon) => {
        await purchaseTemplate(id, coupon);
        setOwned((current) => (current.includes(id) ? current : [...current, id]));
      },
      remember: (invite) => {
        setInvites((current) => [invite, ...current.filter((item) => item.id !== invite.id)]);
      },
    }),
    [owned, invites, ready],
  );

  return <LibraryContext.Provider value={library}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const library = useContext(LibraryContext);
  if (!library) throw new Error("Library missing");
  return library;
}
