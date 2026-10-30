import { auth, db } from "../config.js";
import {
  doc,
  setDoc
} from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  signOut
} from "firebase/auth";



// ================================
// DOM ELEMENTS
// ================================

const signupForm = document.getElementById("signupForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const signupMessage = document.getElementById("signupMessage");
const signupButton = document.getElementById("signupButton");
const googleSignupButton = document.getElementById("googleSignupButton");

// ================================
// HELPER: DISPLAY MESSAGES
// ================================

function showMessage(message, type = "error") {
  if (!signupMessage) return;

  signupMessage.textContent = message;
  signupMessage.className = `signup-message ${type}`;
}

// ================================
// HELPER: BUTTON LOADING STATE
// ================================

function setButtonLoading(button, loading, loadingText = "Please wait...") {
  if (!button) return;

  if (loading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = loadingText;
  } else {
    button.disabled = false;

    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

// ================================
// SHOW / HIDE PASSWORD
// ================================

document.querySelectorAll(".toggle-password").forEach((toggleButton) => {
  toggleButton.addEventListener("click", () => {
    const targetId = toggleButton.dataset.target;
    const targetInput = document.getElementById(targetId);

    if (!targetInput) return;

    const isPassword = targetInput.type === "password";

    targetInput.type = isPassword ? "text" : "password";

    toggleButton.setAttribute(
      "aria-label",
      isPassword ? "Hide password" : "Show password"
    );

    toggleButton.setAttribute(
      "aria-pressed",
      String(isPassword)
    );
  });
});

// ================================
// CLEAR MESSAGE WHEN USER TYPES
// ================================

signupForm?.addEventListener("input", () => {
  if (signupMessage) {
    signupMessage.textContent = "";
    signupMessage.className = "signup-message";
  }
});

// ================================
// EMAIL AND PASSWORD SIGNUP
// ================================

signupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fullName = fullNameInput?.value.trim();
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  const confirmPassword = confirmPasswordInput?.value;

  if (!fullName || !email || !password || !confirmPassword) {
    showMessage("Please fill in all fields.");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Passwords do not match.");
    confirmPasswordInput.focus();
    return;
  }

  if (password.length < 6) {
    showMessage("Password must contain at least 6 characters.");
    passwordInput.focus();
    return;
  }

  setButtonLoading(signupButton, true, "Creating account...");
  if (googleSignupButton) googleSignupButton.disabled = true;

  try {
    // Create Firebase Authentication account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Save user profile in Firestore
    await setDoc(doc(db, "Users", user.uid), {
      uid: user.uid,
      fullName,
      email: user.email,
      createdAt: new Date().toISOString()
    });

    // Send email verification
    await sendEmailVerification(user);

    // Sign out until the user verifies their email
    await signOut(auth);

    showMessage(
      "Account created! Check your email to verify your account before signing in.",
      "success"
    );

    signupForm.reset();

    // Redirect after a short delay so the message can be read
    setTimeout(() => {
      window.location.href = "./signin.html";
    }, 2500);

  } catch (error) {
    console.error("Signup error:", error);

    let message = "Unable to create your account. Please try again.";

    switch (error.code) {
      case "auth/email-already-in-use":
        message = "This email is already registered. Please sign in instead.";
        break;

      case "auth/invalid-email":
        message = "Please enter a valid email address.";
        break;

      case "auth/weak-password":
        message = "Your password is too weak. Use at least 6 characters.";
        break;

      case "auth/operation-not-allowed":
        message = "Email and password sign-up is not enabled in Firebase.";
        break;

      case "auth/network-request-failed":
        message = "Network error. Check your internet connection and try again.";
        break;

      default:
        message = error.message || message;
    }

    showMessage(message);

  } finally {
    setButtonLoading(signupButton, false);
    if (googleSignupButton) googleSignupButton.disabled = false;
  }
});

// ================================
// GOOGLE SIGNUP
// ================================

googleSignupButton?.addEventListener("click", async () => {
  setButtonLoading(googleSignupButton, true, "Connecting to Google...");
  if (signupButton) signupButton.disabled = true;

  try {
    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Create or update the user's Firestore profile
    await setDoc(
      doc(db, "Users", user.uid),
      {
        uid: user.uid,
        fullName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        provider: "google",
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    // Google accounts normally have verified email addresses.
    // Redirect to the dashboard.
    window.location.href = "../pages/dashboard.html";

  } catch (error) {
    console.error("Google signup error:", error);

    let message = "Google sign-up failed. Please try again.";

    switch (error.code) {
      case "auth/popup-closed-by-user":
        message = "Google sign-up was cancelled.";
        break;

      case "auth/popup-blocked":
        message = "Your browser blocked the Google sign-in popup.";
        break;

      case "auth/account-exists-with-different-credential":
        message = "An account already exists with this email using another sign-in method. Please sign in with that method.";
        break;

      case "auth/unauthorized-domain":
        message = "This domain is not authorized for Google sign-in in Firebase.";
        break;

      case "auth/operation-not-allowed":
        message = "Google sign-in is not enabled in Firebase Authentication.";
        break;

      case "auth/network-request-failed":
        message = "Network error. Check your internet connection.";
        break;

      default:
        message = error.message || message;
    }

    showMessage(message);

  } finally {
    setButtonLoading(googleSignupButton, false);
    if (signupButton) signupButton.disabled = false;
  }
});
