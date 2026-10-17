import { googleClientId, logInWithGoogle } from "../api";

const CALLBACK_PATH = "/auth/google/done.html";

type GoogleResult = { source?: string; code?: string; state?: string; error?: string };

let preparing: Promise<string> | null = null;
let cachedClientId = "";

/** Load the client id before the click so the popup can open in the same gesture. */
export function prepareGoogleSignIn() {
  preparing ??= googleClientId()
    .then((id) => {
      if (!id) throw new Error("Google sign-in is not set up yet.");
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
  if (!cachedClientId) {
    return Promise.reject(new Error("Google sign-in is still loading. Try again."));
  }
  const redirectUri = `${window.location.origin}${CALLBACK_PATH}`;
  const state = crypto.randomUUID();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", cachedClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  const width = 480;
  const height = 640;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  const popup = window.open(
    url.toString(),
    "invitesready-google",
    `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)}`,
  );
  if (!popup) return Promise.reject(new Error("Allow pop-ups for Google sign-in, then try again."));

  return new Promise<boolean>((resolve, reject) => {
    let settled = false;
    let closedTimer = 0;
    let watch = 0;
    const finish = (run: () => void) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      window.clearInterval(watch);
      window.clearTimeout(closedTimer);
      run();
    };
    const onMessage = (event: MessageEvent<GoogleResult>) => {
      if (event.origin !== window.location.origin || event.source !== popup) return;
      const data = event.data;
      if (!data || data.source !== "invitesready-google" || data.state !== state) return;
      if (data.code) {
        finish(() => {
          logInWithGoogle(data.code as string, redirectUri).then(resolve, reject);
        });
        return;
      }
      finish(() => {
        reject(new Error(data.error === "access_denied" ? "Google sign-in was cancelled." : "Google sign-in did not finish."));
      });
    };
    window.addEventListener("message", onMessage);
    watch = window.setInterval(() => {
      if (!popup.closed || closedTimer) return;
      closedTimer = window.setTimeout(() => {
        finish(() => reject(new Error("Google sign-in was cancelled.")));
      }, 700);
    }, 400);
  });
}
