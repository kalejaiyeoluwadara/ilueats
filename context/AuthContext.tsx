"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthUser, UserRole } from "@/types";
import { readLocalStorage, shortId, writeLocalStorage } from "@/lib/utils";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_RIDER_EMAIL,
  DEMO_RIDER_PASSWORD,
} from "@/lib/operatorDemoAccounts";

const USERS_KEY = "ilueats:users:v1";
const SESSION_KEY = "ilueats:session:v1";

type UserRecord = AuthUser & { password: string };

type UsersByEmail = Record<string, UserRecord>;

type SessionPayload = { userId: string };

export type SignInOptions = {
  /** If set, only these roles may complete sign-in (others get a portal hint error). */
  allowedRoles?: UserRole[];
};

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (
    email: string,
    password: string,
    options?: SignInOptions
  ) => { ok: true } | { ok: false; error: string };
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

function portalHintForRole(role: UserRole): string {
  if (role === "admin") {
    return "This email is registered as a platform admin. Sign in at /admin/login instead.";
  }
  if (role === "rider") {
    return "This email is registered as a rider. Sign in at /rider/login instead.";
  }
  return "This email is a customer account. Use Account in the IluEats app.";
}

function readUsers(): UsersByEmail {
  return readLocalStorage<UsersByEmail>(USERS_KEY, {});
}

/** Apply migrations when reading so API methods always see consistent shapes. */
function readUsersNormalized(): UsersByEmail {
  const raw = readUsers();
  const { users, changed } = migrateUsersAndSeed(raw);
  if (changed) writeUsers(users);
  return users;
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
    role: r.role,
    ...(r.phone !== undefined && { phone: r.phone }),
  };
}

function migrateUsersAndSeed(raw: UsersByEmail): {
  users: UsersByEmail;
  changed: boolean;
} {
  let changed = false;
  const users: UsersByEmail = { ...raw };

  for (const key of Object.keys(users)) {
    const r = users[key];
    if (r.role === undefined) {
      users[key] = { ...r, role: "customer" };
      changed = true;
    }
  }

  const seeds: UserRecord[] = [
    {
      id: "u_seed_admin",
      name: "Platform Admin",
      email: DEMO_ADMIN_EMAIL,
      password: DEMO_ADMIN_PASSWORD,
      role: "admin",
    },
    {
      id: "u_seed_rider",
      name: "Demo Rider",
      email: DEMO_RIDER_EMAIL,
      password: DEMO_RIDER_PASSWORD,
      role: "rider",
    },
  ];

  for (const seed of seeds) {
    const key = normalizeEmail(seed.email);
    if (!users[key]) {
      users[key] = seed;
      changed = true;
    }
  }

  return { users, changed };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const users = readUsersNormalized();
    const session = readSession();
    if (session?.userId) {
      const record = findUserById(users, session.userId);
      if (record) setUser(toPublicUser(record));
      else writeSession(null);
    }
    setReady(true);
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(
    (email, password, options) => {
      const key = normalizeEmail(email);
      if (!key) return { ok: false, error: "Enter your email." };
      const users = readUsersNormalized();
      const record = users[key];
      if (!record) return { ok: false, error: "No account found for that email." };
      if (record.password !== password)
        return { ok: false, error: "Incorrect password." };

      const allowed = options?.allowedRoles;
      if (allowed && allowed.length > 0 && !allowed.includes(record.role)) {
        return { ok: false, error: portalHintForRole(record.role) };
      }

      writeSession({ userId: record.id });
      setUser(toPublicUser(record));
      return { ok: true };
    },
    []
  );

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
      const users = readUsersNormalized();
      if (users[key]) return { ok: false, error: "An account already exists for that email." };
      const id = shortId("u");
      const record: UserRecord = {
        id,
        name: trimmedName,
        email: email.trim(),
        password: pwd,
        role: "customer",
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
        const users = readUsersNormalized();
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
