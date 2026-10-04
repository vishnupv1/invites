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

function requestCode(clientId: string) {
  const google = window.google;
  if (!google) return Promise.reject(new Error("Could not reach Google. Try again."));
  return new Promise<string>((resolve, reject) => {
    const client = google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: (response) => {
        if (response.code) {
          resolve(response.code);
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

export async function signInWithGoogle() {
  const clientId = await googleClientId();
  if (!clientId) throw new Error("Google sign-in is not set up yet.");
  await loadGoogle();
  const code = await requestCode(clientId);
  await logInWithGoogle(code);
}
