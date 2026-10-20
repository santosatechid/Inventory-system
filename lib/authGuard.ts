import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/services/auth/auth";
import type { Role } from "@/types/inventory";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const user = session.user as typeof session.user & { role?: string };
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: (user.role as Role) ?? "LEADER",
  };
}

export async function guard(roles?: Role[]) {
  const user = await currentUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { message: "Silakan masuk terlebih dahulu." },
        { status: 401 },
      ),
    };
  }
  if (roles && !roles.includes(user.role)) {
    return {
      error: NextResponse.json(
        { message: "Anda tidak memiliki akses ke aksi ini." },
        { status: 403 },
      ),
    };
  }
  return { user };
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}
