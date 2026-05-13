import { AdminShell } from "@/components/admin/AdminShell";
import { ConsoleRoleGate } from "@/components/auth/ConsoleRoleGate";

export default function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConsoleRoleGate role="admin" loginHref="/admin/login">
      <AdminShell>{children}</AdminShell>
    </ConsoleRoleGate>
  );
}
