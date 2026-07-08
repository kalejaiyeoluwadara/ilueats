import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "IluEats — Your town. Your taste. Delivered.",
    template: "%s · IluEats",
  },
  description:
    "Hot food, fresh cakes, juicy burgers and more — delivered fast in Ilisan. Order from your favourite local stores in minutes.",
  keywords: [
    "IluEats",
    "Ilisan food delivery",
    "Nigerian food delivery",
    "Pizza Ilisan",
    "Cakes Ilisan",
    "Local food delivery",
  ],
  applicationName: "IluEats",
  authors: [{ name: "IluEats" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IluEats",
  },
  openGraph: {
    title: "IluEats — Your town. Your taste. Delivered.",
    description:
      "Order food, cakes, smoothies and more from your favourite Ilisan stores.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#e64e0e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${bricolage.variable}`}>
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] antialiased">
        <NextTopLoader
          color="#e8541a"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #e8541a, 0 0 5px #e8541a"
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
