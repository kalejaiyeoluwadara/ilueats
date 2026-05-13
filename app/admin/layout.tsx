import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description: "IluEats operator console",
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
