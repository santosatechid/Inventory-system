import { type NextRequest, NextResponse } from "next/server";

import { bad, guard } from "@/lib/authGuard";
import { handlePrismaError } from "@/services/errorHandler";
import { prisma } from "@/services/prisma";

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;

  const items = await prisma.item.findMany({
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const g = await guard(["ADMIN"]);
  if (g.error) return g.error;

  try {
    const body = await request.json();
    if (!body.code || !body.name || !body.category || !body.unit) {
      return bad("Kode, nama, kategori, dan satuan wajib diisi.");
    }
    const item = await prisma.item.create({
      data: {
        code: String(body.code).trim().toUpperCase(),
        name: body.name,
        category: body.category,
        brand: body.brand || null,
        size: body.size || null,
        unit: body.unit,
        stockGudang: Number(body.stockGudang ?? 0),
        minStock: Number(body.minStock ?? 0),
        supplierId: body.supplierId || null,
      },
      include: { supplier: { select: { id: true, name: true } } },
    });
    await prisma.auditLog.create({
      data: {
        actorId: g.user.id,
        action: "CREATE",
        entity: "item",
        entityId: item.id,
        meta: JSON.stringify({ code: item.code }),
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PUT(request: NextRequest) {
  const g = await guard(["ADMIN"]);
  if (g.error) return g.error;

  try {
    const body = await request.json();
    if (!body.id) return bad("ID item wajib diisi.");
    const item = await prisma.item.update({
      where: { id: body.id },
      data: {
        code: body.code ? String(body.code).trim().toUpperCase() : undefined,
        name: body.name,
        category: body.category,
        brand: body.brand ?? null,
        size: body.size ?? null,
        unit: body.unit,
        minStock: body.minStock === undefined ? undefined : Number(body.minStock),
        supplierId: body.supplierId ?? null,
      },
      include: { supplier: { select: { id: true, name: true } } },
    });
    return NextResponse.json(item);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const g = await guard(["ADMIN"]);
  if (g.error) return g.error;

  try {
    const { id } = await request.json();
    if (!id) return bad("ID item wajib diisi.");
    const item = await prisma.item.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json(item);
  } catch (error) {
    return handlePrismaError(error);
  }
}
