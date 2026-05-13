import { ConsoleRoleGate } from "@/components/auth/ConsoleRoleGate";
import { RiderShell } from "@/components/rider/RiderShell";

export default function RiderPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConsoleRoleGate role="rider" loginHref="/rider/login">
      <RiderShell>{children}</RiderShell>
    </ConsoleRoleGate>
  );
}
