import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favourites",
  description: "Your saved dishes and drinks on IluEats.",
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
