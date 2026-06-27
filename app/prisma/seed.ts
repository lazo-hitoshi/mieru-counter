import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { randomUUID } from "crypto";
import { hashSync } from "bcryptjs";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const adapterConfig = tursoUrl
  ? { url: tursoUrl, authToken: tursoToken }
  : { url: `file:${path.resolve(__dirname, "..", "dev.db")}` };

const adapter = new PrismaLibSql(adapterConfig);
const prisma = new PrismaClient({ adapter });

async function main() {
  const org = await prisma.organization.create({
    data: {
      id: randomUUID(),
      name: "みえる薬局チェーン",
      organizationType: "pharmacy_chain",
      status: "active",
      contactEmail: "admin@mieru-pharmacy.example.com",
    },
  });

  const facility = await prisma.facility.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      name: "みえる薬局 本店",
      facilityType: "pharmacy",
      address: "東京都渋谷区1-2-3",
      phone: "03-1234-5678",
      status: "active",
    },
  });

  const counter = await prisma.counter.create({
    data: {
      id: randomUUID(),
      facilityId: facility.id,
      name: "1番窓口",
      counterCode: "C001",
      qrToken: randomUUID(),
      status: "active",
    },
  });

  await prisma.counter.create({
    data: {
      id: randomUUID(),
      facilityId: facility.id,
      name: "2番窓口",
      counterCode: "C002",
      qrToken: randomUUID(),
      status: "active",
    },
  });

  await prisma.user.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      facilityId: facility.id,
      name: "田中 太郎",
      email: "tanaka@example.com",
      role: "admin",
      passwordHash: hashSync("password123", 10),
      status: "active",
    },
  });

  await prisma.user.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      facilityId: facility.id,
      name: "佐藤 花子",
      email: "sato@example.com",
      role: "staff",
      passwordHash: hashSync("password123", 10),
      status: "active",
    },
  });

  const templates = [
    { category: "reception", title: "お待たせしました", body: "お待たせいたしました。こちらの窓口にお越しください。" },
    { category: "reception", title: "番号でお呼びします", body: "番号札をお持ちですか？番号でお呼びしますのでお待ちください。" },
    { category: "medicine", title: "お薬の説明", body: "こちらのお薬について説明いたします。" },
    { category: "medicine", title: "食後に服用", body: "このお薬は食後に服用してください。" },
    { category: "medicine", title: "副作用の注意", body: "眠くなることがありますので、車の運転は避けてください。" },
    { category: "payment", title: "お会計", body: "お会計は受付でお願いいたします。" },
    { category: "guidance", title: "次回予約", body: "次回のご予約をお取りしますか？" },
    { category: "guidance", title: "お大事に", body: "お大事になさってください。何かありましたらいつでもご相談ください。" },
  ];

  for (const t of templates) {
    await prisma.messageTemplate.create({
      data: {
        id: randomUUID(),
        organizationId: org.id,
        facilityId: facility.id,
        category: t.category,
        title: t.title,
        body: t.body,
        language: "ja",
        isActive: true,
        sortOrder: 0,
      },
    });
  }

  console.log("Seed data created successfully");
  console.log(`  Organization: ${org.name} (${org.id})`);
  console.log(`  Facility: ${facility.name} (${facility.id})`);
  console.log(`  Counter: ${counter.name} (QR: ${counter.qrToken})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
