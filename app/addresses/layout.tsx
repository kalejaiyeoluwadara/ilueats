import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved addresses",
  description: "Manage your saved delivery addresses on IluEats.",
};

export default function AddressesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
