import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";

import { PrismaClient } from "./generated/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const PASSWORD = "luindo123";

const USERS = [
  { name: "Rina Wulandari", email: "admin@luindoprima.co.id", role: "ADMIN" },
  { name: "Dedi Anggara", email: "direktur@luindoprima.co.id", role: "DIREKTUR" },
  { name: "Budi Santoso", email: "leader@luindoprima.co.id", role: "LEADER" },
];

const ITEMS = [
  { code: "FILM-001", name: "Film Radiografi D7", category: "Film", brand: "AGFA", size: "30x40 cm", unit: "box", stockGudang: 420, stockOperasional: 0, minStock: 200 },
  { code: "FILM-002", name: "Film Radiografi D4", category: "Film", brand: "Fujifilm", size: "10x24 in", unit: "box", stockGudang: 186, stockOperasional: 0, minStock: 100 },
  { code: "FILM-003", name: "Film Radiografi D5", category: "Film", brand: "AGFA", size: "30x40 cm", unit: "box", stockGudang: 96, stockOperasional: 0, minStock: 50 },
  { code: "CHM-001", name: "Chemical Developer", category: "Chemical", brand: "Carestream", size: "5 liter", unit: "jerigen", stockGudang: 24, stockOperasional: 0, minStock: 40 },
  { code: "CHM-002", name: "Chemical Fixer", category: "Chemical", brand: "Carestream", size: "5 liter", unit: "jerigen", stockGudang: 18, stockOperasional: 0, minStock: 30 },
  { code: "PNT-001", name: "Penetrant Cleaner", category: "Penetrant", brand: "Chemetall", size: "500 ml", unit: "kaleng", stockGudang: 0, stockOperasional: 0, minStock: 20 },
  { code: "PNT-002", name: "Penetrant Red", category: "Penetrant", brand: "Chemetall", size: "500 ml", unit: "kaleng", stockGudang: 62, stockOperasional: 0, minStock: 40 },
  { code: "PPE-001", name: "Sarung Tangan Timbal", category: "APD", brand: "Lead Line", size: "L", unit: "pasang", stockGudang: 14, stockOperasional: 0, minStock: 10 },
];

const SUPPLIERS = [
  { name: "PT Sinar NDT", contact: "Andi", phone: "021-5550101", email: "sales@sinarndt.co.id" },
  { name: "PT Mitra Kimia", contact: "Sari", phone: "021-5550102", email: "order@mitrakimia.co.id" },
  { name: "CV Teknik Mandiri", contact: "Rudi", phone: "021-5550103", email: "admin@teknikmandiri.co.id" },
];

async function main() {
  const password = await hashPassword(PASSWORD);

  for (const user of USERS) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    const saved = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name: user.name, role: user.role, emailVerified: true },
        })
      : await prisma.user.create({
          data: {
            id: randomUUID(),
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: true,
          },
        });

    await prisma.account.deleteMany({ where: { userId: saved.id } });
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: saved.id,
        providerId: "credential",
        // better-auth matches local credentials by this synthetic issuer.
        issuer: "local:credential",
        userId: saved.id,
        password,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  for (const supplier of SUPPLIERS) {
    const existing = await prisma.supplier.findFirst({ where: { name: supplier.name } });
    if (!existing) await prisma.supplier.create({ data: supplier });
  }

  for (const item of ITEMS) {
    await prisma.item.upsert({
      where: { code: item.code },
      create: item,
      update: { name: item.name, category: item.category, brand: item.brand, size: item.size, unit: item.unit, minStock: item.minStock },
    });
  }

  console.log(`Seed selesai: ${USERS.length} akun, ${SUPPLIERS.length} supplier, ${ITEMS.length} item.`);
  console.log(`Login: admin@luindoprima.co.id / direktur@luindoprima.co.id / leader@luindoprima.co.id — sandi: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
