import { apiFetch } from "./client";

export type BackendRole = "customer" | "admin" | "rider";

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: BackendRole;
}

export interface AuthResponse {
  user: BackendUser;
  token: string;
}

export function signIn(
  email: string,
  password: string,
  allowedRoles?: BackendRole[],
) {
  return apiFetch<AuthResponse>("/auth/signin", {
    method: "POST",
    body: { email, password, allowedRoles },
  });
}

export function signUp(name: string, email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: { name, email, password },
  });
}

export function getSessionUser(token: string) {
  return apiFetch<{ user: BackendUser }>("/auth/session", { token });
}
