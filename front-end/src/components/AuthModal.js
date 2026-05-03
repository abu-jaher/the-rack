import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { X, Mail, Lock, Loader, Eye, EyeOff } from "lucide-react";
import { API_BASE, setSession, getGuestId } from "../utils/session";

/**
 * AuthModal
 *
 * Mounted once at the app root. Listens for `window` events:
 *   - 'open-auth'        -> opens the modal in 'login' mode
 *   - 'open-auth-register' -> opens in 'register' mode
 *
 * On successful auth: saves the token + email to localStorage, calls the
 * server's /cart/merge to move any guest cart items into the user's account,
 * then calls onSuccess(email) so App.js can refresh state.
 */
const AuthModal = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailInputRef = useRef(null);

  /* ---- open / close lifecycle ---- */

  useEffect(() => {
    const openLogin = () => {
      setMode("login");
      setError("");
      setOpen(true);
    };
    const openRegister = () => {
      setMode("register");
      setError("");
      setOpen(true);
    };
    window.addEventListener("open-auth", openLogin);
    window.addEventListener("open-auth-register", openRegister);
    return () => {
      window.removeEventListener("open-auth", openLogin);
      window.removeEventListener("open-auth-register", openRegister);
    };
  }, []);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Lock body scroll while open + autofocus email
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => emailInputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError("");
  };

  /* ---- submit ---- */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const path = mode === "login" ? "/users/login" : "/users/register";
      const res = await axios.post(`${API_BASE}${path}`, { email, password });
      const { token, user } = res.data;

      // 1. Save the session
      setSession(user.email, token);

      // 2. Merge any guest cart items into the user's cart.
      //    This is best-effort: if it fails we still let the user in.
      try {
        const guestId = getGuestId();
        await axios.post(
          `${API_BASE}/cart/merge`,
          { guestId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (mergeErr) {
        console.warn("Cart merge skipped:", mergeErr?.response?.data || mergeErr.message);
      }

      // 3. Notify the rest of the app
      onSuccess(user.email);
      close();
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        (mode === "login"
          ? "Could not sign you in. Please try again."
          : "Could not create your account. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  /* ---- render ---- */

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={close}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-7 sm:p-8 animate-in zoom-in-95 fade-in duration-300">
        {/* Close */}
        <button
          onClick={close}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
          aria-label="Close"
        >
          <X size={18} className="text-gray-500" />
        </button>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
              mode === "login"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
              mode === "register"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Create Account
          </button>
        </div>

        <h2 className="font-display text-3xl sm:text-4xl font-medium text-gray-900 tracking-tight">
          {mode === "login" ? "Welcome back." : "Join The Rack."}
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {mode === "login"
            ? "Sign in to keep your bag, orders, and saved items in sync."
            : "Create an account to save your bag and check out faster."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">
              Email
            </label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-gray-900 focus-within:bg-white transition-colors">
              <Mail size={16} className="text-gray-400 flex-shrink-0" />
              <input
                ref={emailInputRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="flex-grow bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">
              Password
            </label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-gray-900 focus-within:bg-white transition-colors">
              <Lock size={16} className="text-gray-400 flex-shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="flex-grow bg-transparent outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold hover:bg-indigo-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span>{mode === "login" ? "Signing in..." : "Creating account..."}</span>
              </>
            ) : (
              <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
            )}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          {mode === "login" ? "Don't have an account? " : "Already have one? "}
          <button
            type="button"
            onClick={switchMode}
            className="font-bold text-gray-900 hover:text-indigo-600 hover:underline transition-colors"
          >
            {mode === "login" ? "Create one" : "Sign in"}
          </button>
        </p>

        <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
          Your bag is saved to this browser. Signing in moves it to your
          account so you can pick up where you left off on any device.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;