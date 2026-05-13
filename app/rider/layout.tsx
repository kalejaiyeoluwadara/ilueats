import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rider",
  description: "IluEats delivery partner app",
};

export default function RiderRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
