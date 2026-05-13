import { ConsoleRoleGate } from "@/components/auth/ConsoleRoleGate";
import { RiderShell } from "@/components/rider/RiderShell";
import { RiderConsoleProvider } from "@/context/RiderConsoleContext";

export default function RiderPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConsoleRoleGate role="rider" loginHref="/rider/login">
      <RiderShell>
        <RiderConsoleProvider>{children}</RiderConsoleProvider>
      </RiderShell>
    </ConsoleRoleGate>
  );
}
