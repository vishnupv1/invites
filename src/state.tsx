import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { listInvites, listPurchases, purchaseTemplate, type RazorpayPayment } from "./api";
import { useSession } from "./session";
import type { SavedInvite } from "./types";

type Library = {
  owned: string[];
  invites: SavedInvite[];
  ready: boolean;
  purchasesReady: boolean;
  loadInvites: () => void;
  loadPurchases: () => void;
  owns: (id: string, free: boolean) => boolean;
  purchase: (id: string, coupon?: string, payment?: RazorpayPayment) => Promise<void>;
  grant: (id: string) => void;
  remember: (invite: SavedInvite) => void;
  forget: (id: string) => void;
};

const LibraryContext = createContext<Library | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { ready: sessionReady, signedIn, host } = useSession();
  const [owned, setOwned] = useState<string[]>([]);
  const [invites, setInvites] = useState<SavedInvite[]>([]);
  const [ready, setReady] = useState(false);
  const [purchasesReady, setPurchasesReady] = useState(false);
  const generation = useRef(0);
  const invitesFlight = useRef<Promise<void> | null>(null);
  const purchasesFlight = useRef<Promise<void> | null>(null);
  const hostKey = host?.id ?? "";

  useEffect(() => {
    generation.current += 1;
    invitesFlight.current = null;
    purchasesFlight.current = null;
    setOwned([]);
    setInvites([]);
    if (!sessionReady) {
      setReady(false);
      setPurchasesReady(false);
      return;
    }
    if (!signedIn) {
      setReady(true);
      setPurchasesReady(true);
      return;
    }
    setReady(false);
    setPurchasesReady(false);
  }, [sessionReady, signedIn, hostKey]);

  const loadInvites = useCallback(() => {
    if (!sessionReady) return;
    if (!signedIn) {
      setReady(true);
      return;
    }
    if (invitesFlight.current) return;
    const gen = generation.current;
    const flight = listInvites()
      .then((rows) => {
        if (gen === generation.current) setInvites(rows);
      })
      .catch(() => undefined)
      .finally(() => {
        if (gen === generation.current) setReady(true);
      });
    invitesFlight.current = flight;
  }, [sessionReady, signedIn, hostKey]);

  const loadPurchases = useCallback(() => {
    if (!sessionReady) return;
    if (!signedIn) {
      setPurchasesReady(true);
      return;
    }
    if (purchasesFlight.current) return;
    const gen = generation.current;
    const flight = listPurchases()
      .then((rows) => {
        if (gen === generation.current) setOwned(rows);
      })
      .catch(() => undefined)
      .finally(() => {
        if (gen === generation.current) setPurchasesReady(true);
      });
    purchasesFlight.current = flight;
  }, [sessionReady, signedIn, hostKey]);

  const library = useMemo<Library>(
    () => ({
      owned,
      invites,
      ready,
      purchasesReady,
      loadInvites,
      loadPurchases,
      owns: (id, free) => free || owned.includes(id),
      purchase: async (id, coupon, payment) => {
        await purchaseTemplate(id, coupon, payment);
        setOwned((current) => (current.includes(id) ? current : [...current, id]));
      },
      grant: (id) => {
        setOwned((current) => (current.includes(id) ? current : [...current, id]));
      },
      remember: (invite) => {
        setInvites((current) => [invite, ...current.filter((item) => item.id !== invite.id)]);
      },
      forget: (id) => {
        setInvites((current) => current.filter((item) => item.id !== id));
      },
    }),
    [owned, invites, ready, purchasesReady, loadInvites, loadPurchases],
  );

  return <LibraryContext.Provider value={library}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const library = useContext(LibraryContext);
  if (!library) throw new Error("Library missing");
  return library;
}
