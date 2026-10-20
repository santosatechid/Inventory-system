import { hashPassword } from "better-auth/crypto";
import { type NextRequest, NextResponse } from "next/server";

import { bad, guard } from "@/lib/authGuard";
import { handlePrismaError } from "@/services/errorHandler";
import { auth } from "@/services/auth/auth";
import { prisma } from "@/services/prisma";

const ROLES = ["ADMIN", "DIREKTUR", "LEADER"];

export async function GET() {
  const g = await guard(["ADMIN"]);
  if (g.error) return g.error;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const g = await guard(["ADMIN"]);
  if (g.error) return g.error;

  try {
    const body = await request.json();
    if (!body.name || !body.email || !body.password) {
      return bad("Nama, email, dan kata sandi wajib diisi.");
    }
    if (String(body.password).length < 8) {
      return bad("Kata sandi minimal 8 karakter.");
    }
    if (body.role && !ROLES.includes(body.role)) {
      return bad("Role tidak valid.");
    }

    const exists = await prisma.user.findUnique({
      where: { email: String(body.email).toLowerCase() },
    });
    if (exists) return bad("Email sudah terdaftar.", 409);

    const created = await auth.api.signUpEmail({
      body: {
        name: body.name,
        email: String(body.email).toLowerCase(),
        password: body.password,
      },
    });

    const user = await prisma.user.update({
      where: { id: created.user.id },
      data: { role: body.role || "LEADER", emailVerified: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const g = await guard(["ADMIN"]);
  if (g.error) return g.error;

  try {
    const body = await request.json();
    if (!body.id) return bad("ID pengguna wajib diisi.");
    if (body.role && !ROLES.includes(body.role)) {
      return bad("Role tidak valid.");
    }
    if (body.id === g.user.id && body.banned === true) {
      return bad("Anda tidak dapat menonaktifkan akun sendiri.");
    }
    if (body.password && String(body.password).length < 8) {
      return bad("Kata sandi minimal 8 karakter.");
    }

    const user = await prisma.user.update({
      where: { id: body.id },
      data: {
        name: body.name,
        email: body.email ? String(body.email).toLowerCase() : undefined,
        role: body.role,
        banned: body.banned,
        banReason: body.banned === true ? "Dinonaktifkan Admin" : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    });

    if (body.password) {
      const password = await hashPassword(body.password);
      const account = await prisma.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
      });
      if (account) {
        await prisma.account.update({
          where: { id: account.id },
          data: { password },
        });
      } else {
        await prisma.account.create({
          data: {
            id: crypto.randomUUID(),
            accountId: user.id,
            providerId: "credential",
            userId: user.id,
            password,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    return handlePrismaError(error);
  }
}
