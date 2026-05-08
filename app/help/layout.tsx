import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & support",
  description:
    "Get answers about ordering, delivery, and your IluEats account.",
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
