import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { auth } from "@/services/auth/auth";
import type { Role } from "@/types/inventory";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/auth/signIn");

  const user = session.user as typeof session.user & { role?: string };

  return (
    <AppShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: (user.role as Role) ?? "LEADER",
      }}
    >
      {children}
    </AppShell>
  );
}
