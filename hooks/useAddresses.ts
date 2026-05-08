"use client";

import { useContext } from "react";
import { AddressesContext } from "@/context/AddressesContext";

export function useAddresses() {
  const ctx = useContext(AddressesContext);
  if (!ctx) {
    throw new Error("useAddresses must be used within an AddressesProvider");
  }
  return ctx;
}
