import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "./db";
import { bills, meterReadings } from "./schema";

export async function getLatestReading() {
  const [row] = await db
    .select()
    .from(meterReadings)
    .orderBy(desc(meterReadings.readingDate))
    .limit(1);
  return row ?? null;
}

export async function listRecentReadings(limit = 20) {
  return db
    .select()
    .from(meterReadings)
    .orderBy(desc(meterReadings.readingDate))
    .limit(limit);
}

export async function listAllReadings() {
  return db.select().from(meterReadings).orderBy(asc(meterReadings.readingDate));
}

export async function listReadingsRange(from: string, to: string) {
  return db
    .select()
    .from(meterReadings)
    .where(
      and(
        gte(meterReadings.readingDate, from),
        lte(meterReadings.readingDate, to),
      ),
    )
    .orderBy(asc(meterReadings.readingDate));
}

export async function addReading(input: {
  readingDate: string;
  meterIndexM3: number;
  notes?: string;
  source?: string;
}) {
  const createdAt = new Date().toISOString();
  await db.insert(meterReadings).values({
    id: crypto.randomUUID(),
    readingDate: input.readingDate,
    meterIndexM3: input.meterIndexM3,
    notes: input.notes?.trim() || null,
    source: input.source ?? "manual",
    createdAt,
  });
}

export async function deleteReading(id: string) {
  await db.delete(meterReadings).where(eq(meterReadings.id, id));
}

export async function listBills() {
  return db.select().from(bills).orderBy(desc(bills.periodStart));
}

export async function latestBill() {
  const [row] = await db.select().from(bills).orderBy(desc(bills.periodEnd)).limit(1);
  return row ?? null;
}

export async function addBill(input: {
  periodStart: string;
  periodEnd: string;
  officialVolumeM3: number;
  officialTotalEur: number;
  providerName?: string;
  notes?: string;
}) {
  const createdAt = new Date().toISOString();
  await db.insert(bills).values({
    id: crypto.randomUUID(),
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    officialVolumeM3: input.officialVolumeM3,
    officialTotalEur: input.officialTotalEur,
    providerName: input.providerName?.trim() || null,
    notes: input.notes?.trim() || null,
    createdAt,
  });
}

export async function deleteBill(id: string) {
  await db.delete(bills).where(eq(bills.id, id));
}
