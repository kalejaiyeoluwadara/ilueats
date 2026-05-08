"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SavedAddress } from "@/types";
import { readLocalStorage, shortId, writeLocalStorage } from "@/lib/utils";

const STORAGE_KEY = "ilueats:addresses:v1";

function isSavedAddress(x: unknown): x is SavedAddress {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.label === "string" &&
    typeof o.addressLine === "string" &&
    typeof o.isDefault === "boolean"
  );
}

function normalizeAddresses(list: SavedAddress[]): SavedAddress[] {
  if (list.length === 0) return [];
  const defaults = list.filter((a) => a.isDefault);
  if (defaults.length === 0) {
    return list.map((a, i) => ({ ...a, isDefault: i === 0 }));
  }
  if (defaults.length === 1) return list;
  let seen = false;
  return list.map((a) => {
    if (a.isDefault && !seen) {
      seen = true;
      return a;
    }
    return { ...a, isDefault: false };
  });
}

interface AddressesContextValue {
  addresses: SavedAddress[];
  ready: boolean;
  defaultAddress: SavedAddress | null;
  addAddress: (input: {
    label: string;
    addressLine: string;
    phone?: string;
    makeDefault?: boolean;
  }) => void;
  updateAddress: (
    id: string,
    patch: Partial<
      Pick<SavedAddress, "label" | "addressLine" | "phone" | "isDefault">
    >
  ) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
}

export const AddressesContext = createContext<AddressesContextValue | null>(
  null
);

export function AddressesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [ready, setReady] = useState(false);
  const skipNextWrite = useRef(true);

  useEffect(() => {
    const raw = readLocalStorage<unknown>(STORAGE_KEY, []);
    const list = Array.isArray(raw) ? raw.filter(isSavedAddress) : [];
    setAddresses(normalizeAddresses(list));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    writeLocalStorage(STORAGE_KEY, addresses);
  }, [addresses, ready]);

  const defaultAddress = useMemo(() => {
    const d = addresses.find((a) => a.isDefault);
    return d ?? addresses[0] ?? null;
  }, [addresses]);

  const setDefaultAddress = useCallback((id: string) => {
    setAddresses((prev) =>
      normalizeAddresses(
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      )
    );
  }, []);

  const addAddress = useCallback<AddressesContextValue["addAddress"]>(
    ({ label, addressLine, phone, makeDefault }) => {
      const trimmedLabel = label.trim();
      const trimmedLine = addressLine.trim();
      if (!trimmedLabel || !trimmedLine) return;
      const id = shortId("addr");
      setAddresses((prev) => {
        const isFirst = prev.length === 0;
        const shouldDefault = makeDefault ?? isFirst;
        const next: SavedAddress = {
          id,
          label: trimmedLabel,
          addressLine: trimmedLine,
          phone: phone?.trim() || undefined,
          isDefault: shouldDefault,
        };
        let merged = [...prev, next];
        if (shouldDefault) {
          merged = merged.map((a) =>
            a.id === id ? a : { ...a, isDefault: false }
          );
        }
        return normalizeAddresses(merged);
      });
    },
    []
  );

  const updateAddress = useCallback<AddressesContextValue["updateAddress"]>(
    (id, patch) => {
      setAddresses((prev) => {
        let next = prev.map((a) => {
          if (a.id !== id) return a;
          const updated = { ...a };
          if (patch.label !== undefined) {
            updated.label = patch.label.trim();
          }
          if (patch.addressLine !== undefined) {
            updated.addressLine = patch.addressLine.trim();
          }
          if (patch.phone !== undefined) {
            updated.phone = patch.phone.trim() || undefined;
          }
          if (patch.isDefault !== undefined) {
            updated.isDefault = patch.isDefault;
          }
          return updated;
        });
        if (patch.isDefault) {
          next = next.map((a) => ({ ...a, isDefault: a.id === id }));
        }
        return normalizeAddresses(next);
      });
    },
    []
  );

  const removeAddress = useCallback((id: string) => {
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      return normalizeAddresses(next);
    });
  }, []);

  const value = useMemo(
    () => ({
      addresses,
      ready,
      defaultAddress,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
    }),
    [
      addresses,
      ready,
      defaultAddress,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
    ]
  );

  return (
    <AddressesContext.Provider value={value}>
      {children}
    </AddressesContext.Provider>
  );
}
