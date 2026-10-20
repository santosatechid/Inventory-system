import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/services/auth/auth";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  redirect(session?.user ? "/dashboard" : "/auth/signIn");
}
