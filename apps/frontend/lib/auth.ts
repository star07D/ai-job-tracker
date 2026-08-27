"use client";

export function getToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("token");
}

export function isAuthenticated() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "/login";
}
