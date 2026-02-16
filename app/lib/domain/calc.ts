import type { Bill, MeterReading } from "~/lib/server/schema";

export type DashboardPoint = {
  month: string;
  consumptionM3: number;
  estimatedCostEur: number;
};

function dayDiff(from: string, to: string) {
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  const diffMs = toDate.getTime() - fromDate.getTime();
  return Math.max(1, Math.round(diffMs / 86400000));
}

export function deriveMonthlySeries(
  readings: MeterReading[],
  effectiveRate: number,
): DashboardPoint[] {
  const points = new Map<string, number>();

  for (let i = 1; i < readings.length; i += 1) {
    const prev = readings[i - 1];
    const curr = readings[i];
    const delta = curr.meterIndexM3 - prev.meterIndexM3;
    if (delta <= 0) continue;

    const days = dayDiff(prev.readingDate, curr.readingDate);
    const daily = delta / days;

    let cursor = new Date(`${prev.readingDate}T00:00:00Z`);
    for (let d = 0; d < days; d += 1) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      const monthKey = cursor.toISOString().slice(0, 7);
      points.set(monthKey, (points.get(monthKey) ?? 0) + daily);
    }
  }

  return [...points.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, consumptionM3]) => ({
      month,
      consumptionM3: Number(consumptionM3.toFixed(2)),
      estimatedCostEur: Number((consumptionM3 * effectiveRate).toFixed(2)),
    }));
}

export function getEffectiveRate(lastBill: Bill | null) {
  if (!lastBill || lastBill.officialVolumeM3 <= 0) return 0;
  return lastBill.officialTotalEur / lastBill.officialVolumeM3;
}

export function compareBill(readings: MeterReading[], bill: Bill, effectiveRate: number) {
  const inRange = readings
    .filter((r) => r.readingDate >= bill.periodStart && r.readingDate <= bill.periodEnd)
    .sort((a, b) => a.readingDate.localeCompare(b.readingDate));

  if (inRange.length < 2) {
    return {
      estimatedVolumeM3: 0,
      volumeDeltaM3: -bill.officialVolumeM3,
      estimatedCostEur: 0,
      costDeltaEur: -bill.officialTotalEur,
    };
  }

  const estimatedVolumeM3 = Number(
    (inRange[inRange.length - 1].meterIndexM3 - inRange[0].meterIndexM3).toFixed(2),
  );
  const estimatedCostEur = Number((estimatedVolumeM3 * effectiveRate).toFixed(2));

  return {
    estimatedVolumeM3,
    volumeDeltaM3: Number((estimatedVolumeM3 - bill.officialVolumeM3).toFixed(2)),
    estimatedCostEur,
    costDeltaEur: Number((estimatedCostEur - bill.officialTotalEur).toFixed(2)),
  };
}
