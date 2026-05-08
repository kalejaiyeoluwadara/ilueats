import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & terms",
  description: "How IluEats handles your information and terms of use.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
