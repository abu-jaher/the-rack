export const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:5001";

/* ---------------- guest id ---------------- */

function generateGuestId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return "guest_" + crypto.randomUUID();
  }
  return (
    "guest_" +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

export function getGuestId() {
  let id = localStorage.getItem("guestId");
  if (!id) {
    id = generateGuestId();
    localStorage.setItem("guestId", id);
  }
  return id;
}

/* ---------------- auth ---------------- */

export function getAuthToken() {
  return localStorage.getItem("authToken") || null;
}

export function getUserEmail() {
  return localStorage.getItem("userEmail") || "";
}

export function isLoggedIn() {
  return Boolean(getAuthToken() && getUserEmail());
}

export function setSession(email, token) {
  localStorage.setItem("userEmail", email);
  localStorage.setItem("authToken", token);
}

export function clearSession() {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("authToken");
}

/* ---------------- request configs ---------------- */

export function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function cartConfig() {
  return {
    headers: authHeaders(),
    params: { guestId: getGuestId() },
  };
}