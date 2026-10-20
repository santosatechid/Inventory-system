"use client";

import { Loader2, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, signIn } from "@/services/auth/authClients";

const DEMO = [
  { email: "admin@luindoprima.co.id", role: "Admin" },
  { email: "direktur@luindoprima.co.id", role: "Direktur" },
  { email: "leader@luindoprima.co.id", role: "Leader" },
];

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@luindoprima.co.id");
  const [password, setPassword] = useState("luindo123");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email || !password) {
      toast.error("Email dan kata sandi wajib diisi.");
      return;
    }

    setLoading(true);
    const { error } = await signIn.email({ email, password, rememberMe: remember });
    if (error) {
      setLoading(false);
      toast.error(error.message || "Gagal masuk. Periksa email dan kata sandi.");
      return;
    }

    const session = await authClient.getSession();
    const role = (session.data?.user as { role?: string } | undefined)?.role;
    toast.success("Berhasil masuk.");
    router.push(
      role === "DIREKTUR"
        ? "/approvals"
        : role === "LEADER"
          ? "/requests"
          : "/dashboard",
    );
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="bg-navy text-navy-foreground flex shrink-0 flex-col justify-between p-8 lg:w-[600px] lg:p-[52px]">
        <div className="flex items-center gap-3">
          <span className="bg-navy-foreground text-navy flex size-9 items-center justify-center rounded-lg text-[11px] font-bold">
            LP
          </span>
          <span className="text-[13px] font-semibold">NDT Inventory</span>
          <span className="text-navy-muted text-[10px]">· PT Luindo Prima</span>
        </div>

        <div className="mt-16 flex flex-col gap-4 lg:mt-0">
          <h1 className="text-4xl font-bold tracking-[-1.2px]">
            PT Luindo Prima
          </h1>
          <p className="text-navy-muted text-[13.5px] leading-6">
            Sistem operasional inventori consumable untuk pekerjaan inspeksi NDT.
          </p>
        </div>

        <p className="text-navy-muted mt-16 text-[10.5px] lg:mt-0">
          PT Luindo Prima · Rawalumbu, Bekasi
        </p>
      </aside>

      <section className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="border-border w-full max-w-[384px] rounded-xl border p-7">
          <div className="flex items-center gap-3">
            <span className="bg-foreground text-background flex h-[42px] w-16 items-center justify-center rounded-md text-[13px] font-bold">
              LP
            </span>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.5px]">
                PT LUINDO PRIMA
              </p>
              <p className="text-muted-foreground text-[10.5px]">
                Sistem Inventori Consumable NDT
              </p>
            </div>
          </div>

          <div className="bg-border my-4 h-px" />

          <h2 className="text-xl font-semibold tracking-[-0.4px]">
            Masuk ke akun Anda
          </h2>
          <p className="text-muted-foreground mt-1 text-[12.5px]">
            Gunakan email kantor yang diberikan Admin.
          </p>

          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-[11.5px]">
                Email
              </Label>
              <div className="border-border focus-within:ring-ring/30 flex items-center gap-2 rounded-lg border px-3 py-2.5 focus-within:ring-3">
                <Mail className="text-muted-foreground size-3.5 shrink-0" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@luindoprima.co.id"
                  className="h-auto border-0 bg-transparent p-0 text-[12.5px] shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[11.5px]">
                  Kata Sandi
                </Label>
                <button
                  type="button"
                  onClick={() =>
                    toast.info("Hubungi Admin untuk mereset kata sandi.")
                  }
                  className="text-muted-foreground hover:text-foreground text-[11.5px]"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="border-border focus-within:ring-ring/30 flex items-center gap-2 rounded-lg border px-3 py-2.5 focus-within:ring-3">
                <Lock className="text-muted-foreground size-3.5 shrink-0" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="h-auto border-0 bg-transparent p-0 text-[12.5px] shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
              />
              <Label
                htmlFor="remember"
                className="text-muted-foreground cursor-pointer text-[11.5px] font-normal"
              >
                Ingat saya
              </Label>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : null}
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-2.5">
            <span className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-[10.5px]">
              Akun demo
            </span>
            <span className="bg-border h-px flex-1" />
          </div>

          <div className="flex flex-col gap-1.5">
            {DEMO.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword("luindo123");
                }}
                className="bg-muted hover:bg-secondary flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left"
              >
                <span className="text-muted-foreground text-[11px]">
                  {account.email}
                </span>
                <span className="text-[10.5px] font-medium">
                  {account.role}
                </span>
              </button>
            ))}
          </div>

          <p className="text-muted-foreground mt-4 text-[10px]">
            Sandi demo: luindo123 · Dikembangkan oleh PT Santosa Tech Indonesia
          </p>
        </div>
      </section>
    </div>
  );
}
