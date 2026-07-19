import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Chat, call, or email the ìlúEats team — plus answers about ordering, delivery, and your account.",
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
