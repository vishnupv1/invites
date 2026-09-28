import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { signOut } from "../api";

export function AccountMenu({ name, signedIn, children }: { name: string; signedIn: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="acct-menu" ref={root}>
      <button
        type="button"
        className="avatar"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {children}
      </button>
      {open ? (
        <div className="acct-pop" id={menuId} role="menu" onPointerDown={(event) => event.stopPropagation()}>
          <div className="acct-pop-name">{signedIn ? name || "Your account" : "Not signed in"}</div>
          {signedIn ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void signOut().finally(() => window.location.assign("/"));
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
                <path d="M10 17l-5-5 5-5M5 12h11" />
              </svg>
              Log out
            </button>
          ) : (
            <Link role="menuitem" to="/login" onClick={() => setOpen(false)}>
              Log in
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
