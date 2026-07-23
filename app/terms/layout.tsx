import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description:
    "The terms that govern your use of ìlúEats — ordering, payment, delivery, cancellations, and your responsibilities.",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
