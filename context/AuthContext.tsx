"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthUser } from "@/types";
import { readLocalStorage, shortId, writeLocalStorage } from "@/lib/utils";

const USERS_KEY = "ilueats:users:v1";
const SESSION_KEY = "ilueats:session:v1";

type UserRecord = AuthUser & { password: string };

type UsersByEmail = Record<string, UserRecord>;

type SessionPayload = { userId: string };

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  signUp: (
    name: string,
    email: string,
    password: string
  ) => { ok: true } | { ok: false; error: string };
  signOut: () => void;
  updateProfile: (updates: { name?: string; phone?: string }) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readUsers(): UsersByEmail {
  return readLocalStorage<UsersByEmail>(USERS_KEY, {});
}

function writeUsers(users: UsersByEmail) {
  writeLocalStorage(USERS_KEY, users);
}

function readSession(): SessionPayload | null {
  return readLocalStorage<SessionPayload | null>(SESSION_KEY, null);
}

function writeSession(session: SessionPayload | null) {
  writeLocalStorage(SESSION_KEY, session);
}

function findUserById(users: UsersByEmail, userId: string): UserRecord | null {
  for (const r of Object.values(users)) {
    if (r.id === userId) return r;
  }
  return null;
}

function toPublicUser(r: UserRecord): AuthUser {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    ...(r.phone !== undefined && { phone: r.phone }),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const users = readUsers();
    const session = readSession();
    if (session?.userId) {
      const record = findUserById(users, session.userId);
      if (record) setUser(toPublicUser(record));
      else writeSession(null);
    }
    setReady(true);
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>((email, password) => {
    const key = normalizeEmail(email);
    if (!key) return { ok: false, error: "Enter your email." };
    const users = readUsers();
    const record = users[key];
    if (!record) return { ok: false, error: "No account found for that email." };
    if (record.password !== password)
      return { ok: false, error: "Incorrect password." };
    writeSession({ userId: record.id });
    setUser(toPublicUser(record));
    return { ok: true };
  }, []);

  const signUp = useCallback<AuthContextValue["signUp"]>(
    (name, email, password) => {
      const trimmedName = name.trim();
      const key = normalizeEmail(email);
      const pwd = password.trim();
      if (trimmedName.length < 2) return { ok: false, error: "Enter your name." };
      if (!key || !email.includes("@"))
        return { ok: false, error: "Enter a valid email." };
      if (pwd.length < 4)
        return { ok: false, error: "Password must be at least 4 characters." };
      const users = readUsers();
      if (users[key]) return { ok: false, error: "An account already exists for that email." };
      const id = shortId("u");
      const record: UserRecord = {
        id,
        name: trimmedName,
        email: email.trim(),
        password: pwd,
      };
      users[key] = record;
      writeUsers(users);
      writeSession({ userId: id });
      setUser(toPublicUser(record));
      return { ok: true };
    },
    []
  );

  const signOut = useCallback(() => {
    writeSession(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    (updates) => {
      setUser((current) => {
        if (!current) return current;
        const users = readUsers();
        const key = normalizeEmail(current.email);
        const record = users[key];
        if (!record) return current;
        const next: UserRecord = {
          ...record,
          ...(updates.name !== undefined && { name: updates.name.trim() || record.name }),
          ...(updates.phone !== undefined && {
            phone: updates.phone.trim() || undefined,
          }),
        };
        users[key] = next;
        writeUsers(users);
        return toPublicUser(next);
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [user, ready, signIn, signUp, signOut, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
