import type { Session, User } from "@/lib/types";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function canUseBrowserStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1] || "") : null;
}

function deleteCookie(name: string) {
  setCookie(name, "", 0);
}

export function getStoredSession(): Session | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const token = getCookie(TOKEN_KEY);
  const rawUser = window.localStorage.getItem(USER_KEY);

  if (!token || !rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser) as User;
    return { token, user };
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(session: Session) {
  if (!canUseBrowserStorage()) {
    return;
  }

  setCookie(TOKEN_KEY, session.token, COOKIE_MAX_AGE_SECONDS);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession() {
  if (!canUseBrowserStorage()) {
    return;
  }

  deleteCookie(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
