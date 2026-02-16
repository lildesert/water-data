import { real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const meterReadings = sqliteTable("meter_readings", {
  id: text("id").primaryKey(),
  readingDate: text("reading_date").notNull().unique(),
  meterIndexM3: real("meter_index_m3").notNull(),
  source: text("source").notNull().default("manual"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const bills = sqliteTable("bills", {
  id: text("id").primaryKey(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  officialVolumeM3: real("official_volume_m3").notNull(),
  officialTotalEur: real("official_total_eur").notNull(),
  providerName: text("provider_name"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export type MeterReading = typeof meterReadings.$inferSelect;
export type Bill = typeof bills.$inferSelect;
