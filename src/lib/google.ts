import { googleClientId, logInWithGoogle } from "../api";

type CodeResponse = { code?: string; error?: string };

type CodeClient = {
  requestCode: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: "popup";
            callback: (response: CodeResponse) => void;
          }) => CodeClient;
        };
      };
    };
  }
}

let loading: Promise<void> | null = null;
let cachedClientId = "";
let preparing: Promise<string> | null = null;

function loadGoogle() {
  if (window.google?.accounts.oauth2) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loading = null;
        reject(new Error("Could not reach Google. Try again."));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

/** Load Google before the click so the popup can open in the same gesture. */
export function prepareGoogleSignIn() {
  preparing ??= googleClientId()
    .then(async (id) => {
      if (!id) throw new Error("Google sign-in is not set up yet.");
      await loadGoogle();
      cachedClientId = id;
      return id;
    })
    .catch((error: unknown) => {
      preparing = null;
      throw error;
    });
  return preparing;
}

export function signInWithGoogle() {
  const google = window.google;
  if (!cachedClientId || !google?.accounts.oauth2) {
    return Promise.reject(new Error("Google sign-in is still loading. Try again."));
  }
  const clientId = cachedClientId;
  return new Promise<boolean>((resolve, reject) => {
    const client = google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: (response) => {
        if (response.code) {
          logInWithGoogle(response.code).then(resolve, reject);
          return;
        }
        if (response.error === "access_denied") {
          reject(new Error("Google sign-in was cancelled."));
          return;
        }
        reject(new Error("Google sign-in did not finish."));
      },
    });
    client.requestCode();
  });
}
