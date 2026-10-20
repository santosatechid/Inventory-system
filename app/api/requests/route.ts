import { type NextRequest, NextResponse } from "next/server";

import { bad, guard } from "@/lib/authGuard";
import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";

const include = {
  leader: { select: { id: true, name: true } },
  admin: { select: { name: true } },
  director: { select: { name: true } },
  items: { include: { item: true } },
  delivery: { select: { id: true, number: true, status: true } },
} as const;

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;

  const rows = await prisma.request.findMany({
    where: g.user.role === "LEADER" ? { leaderId: g.user.id } : undefined,
    include,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const g = await guard(["LEADER"]);
  if (g.error) return g.error;

  try {
    const body = await request.json();
    const items: { itemId: string; qty: number }[] = body.items ?? [];

    if (!body.jobNo || !body.site || !body.neededAt || items.length === 0) {
      return bad("Nomor pekerjaan, site, tanggal dibutuhkan, dan item wajib diisi.");
    }
    if (items.some((row) => !row.itemId || Number(row.qty) <= 0)) {
      return bad("Jumlah setiap item harus lebih dari nol.");
    }

    const year = new Date().getFullYear();
    const count = await prisma.request.count({
      where: { number: { startsWith: `REQ-${year}-` } },
    });

    const created = await prisma.request.create({
      data: {
        number: `REQ-${year}-${String(count + 1).padStart(4, "0")}`,
        jobNo: body.jobNo,
        site: body.site,
        customer: body.customer || null,
        neededAt: new Date(body.neededAt),
        estimatedDoneAt: body.estimatedDoneAt
          ? new Date(body.estimatedDoneAt)
          : null,
        note: body.note || null,
        leaderId: g.user.id,
        items: {
          create: items.map((row) => ({
            itemId: row.itemId,
            qty: Number(row.qty),
          })),
        },
      },
      include,
    });

    await prisma.auditLog.create({
      data: {
        actorId: g.user.id,
        action: "CREATE",
        entity: "request",
        entityId: created.id,
        meta: JSON.stringify({ number: created.number }),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const g = await guard(["ADMIN", "DIREKTUR"]);
  if (g.error) return g.error;

  try {
    const body = await request.json();
    const { id, action, note } = body;
    if (!id || !["approve", "reject"].includes(action)) {
      return bad("Aksi tidak valid.");
    }

    const row = await prisma.request.findUnique({ where: { id } });
    if (!row) return bad("Request tidak ditemukan.", 404);

    if (g.user.role === "ADMIN" && row.status !== "PENDING_ADMIN") {
      return bad("Request ini bukan bagian persetujuan Admin.");
    }
    if (g.user.role === "DIREKTUR" && row.status !== "PENDING_DIRECTOR") {
      return bad("Request ini bukan bagian persetujuan Direktur.");
    }

    if (g.user.role === "ADMIN") {
      const updated = await prisma.request.update({
        where: { id },
        data: {
          status: action === "approve" ? "PENDING_DIRECTOR" : "REJECTED",
          adminId: g.user.id,
          adminNote: note || null,
          decidedAt: action === "reject" ? new Date() : null,
        },
        include,
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.request.update({
      where: { id },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        directorId: g.user.id,
        directorNote: note || null,
        decidedAt: new Date(),
      },
      include,
    });

    await prisma.auditLog.create({
      data: {
        actorId: g.user.id,
        action: action.toUpperCase(),
        entity: "request",
        entityId: id,
        meta: JSON.stringify({ number: row.number }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handlePrismaError(error);
  }
}
