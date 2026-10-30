const MESSAGES = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Check your connection.",
};
export const friendlyError = (e) => MESSAGES[e.code] || "Something went wrong. Please try again.";

export function showMessage(el, text) {
  el.textContent = text;
  el.hidden = !text;
}
export function setLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait…" : label;
}
