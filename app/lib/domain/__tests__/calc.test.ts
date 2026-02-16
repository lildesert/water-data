import assert from "node:assert/strict";
import test from "node:test";

import { compareBill, deriveMonthlySeries, getEffectiveRate } from "../calc";

test("deriveMonthlySeries returns monthly aggregates", () => {
  const points = deriveMonthlySeries(
    [
      { id: "1", readingDate: "2026-01-01", meterIndexM3: 100, source: "manual", notes: null, createdAt: "" },
      { id: "2", readingDate: "2026-01-11", meterIndexM3: 110, source: "manual", notes: null, createdAt: "" },
      { id: "3", readingDate: "2026-02-10", meterIndexM3: 125, source: "manual", notes: null, createdAt: "" },
    ],
    2,
  );

  assert.ok(points.length > 0);
  const jan = points.find((p) => p.month === "2026-01");
  assert.ok(jan);
  assert.ok(jan.consumptionM3 > 0);
});

test("getEffectiveRate computes bill-based EUR/m3", () => {
  const rate = getEffectiveRate({
    id: "b1",
    periodStart: "2025-01-01",
    periodEnd: "2025-06-30",
    officialVolumeM3: 100,
    officialTotalEur: 320,
    providerName: null,
    notes: null,
    createdAt: "",
  });

  assert.equal(rate, 3.2);
});

test("compareBill computes tracked deltas", () => {
  const result = compareBill(
    [
      { id: "1", readingDate: "2026-01-01", meterIndexM3: 100, source: "manual", notes: null, createdAt: "" },
      { id: "2", readingDate: "2026-03-01", meterIndexM3: 112, source: "manual", notes: null, createdAt: "" },
    ],
    {
      id: "b1",
      periodStart: "2026-01-01",
      periodEnd: "2026-03-01",
      officialVolumeM3: 10,
      officialTotalEur: 30,
      providerName: null,
      notes: null,
      createdAt: "",
    },
    3,
  );

  assert.equal(result.estimatedVolumeM3, 12);
  assert.equal(result.estimatedCostEur, 36);
});
