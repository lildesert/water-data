import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLoaderData } from "react-router";

import { Card, CardDescription, CardTitle } from "~/components/ui/card";
import { deriveMonthlySeries, getEffectiveRate } from "~/lib/domain/calc";
import { formatEur, formatM3 } from "~/lib/domain/format";
import { latestBill, listAllReadings } from "~/lib/server/queries";

import type { Route } from "./+types/dashboard";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Dashboard | Water Tracker" }];
}

export async function loader(_: Route.LoaderArgs) {
  const [readings, bill] = await Promise.all([listAllReadings(), latestBill()]);
  const rate = getEffectiveRate(bill);
  const monthly = deriveMonthlySeries(readings, rate);

  const thisMonth = monthly[monthly.length - 1];

  return {
    monthly,
    rate,
    thisMonthConsumption: thisMonth?.consumptionM3 ?? 0,
    thisMonthEstimate: thisMonth?.estimatedCostEur ?? 0,
  };
}

export default function DashboardRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <section className="space-y-5 pb-24">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="bg-amber-100">
          <CardDescription>This month consumption</CardDescription>
          <CardTitle className="mt-2 text-2xl">{formatM3(data.thisMonthConsumption)}</CardTitle>
        </Card>
        <Card className="bg-lime-100">
          <CardDescription>Estimated monthly cost</CardDescription>
          <CardTitle className="mt-2 text-2xl">{formatEur(data.thisMonthEstimate)}</CardTitle>
        </Card>
        <Card className="bg-fuchsia-100">
          <CardDescription>Current effective rate</CardDescription>
          <CardTitle className="mt-2 text-2xl">
            {data.rate > 0 ? `${formatEur(data.rate)}/m3` : "Add a bill first"}
          </CardTitle>
        </Card>
      </div>

      <Card>
        <CardTitle>Monthly evolution</CardTitle>
        <CardDescription className="mt-1">Consumption and estimated price by month.</CardDescription>

        {data.monthly.length < 2 ? (
          <p className="mt-6 text-sm text-zinc-600">Add at least 2 readings to unlock the chart.</p>
        ) : (
          <div className="mt-4 w-full min-w-0">
            <ResponsiveContainer width="100%" height={320} minWidth={0}>
              <BarChart data={data.monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="consumptionM3" fill="#14b8a6" radius={8} />
                <Bar dataKey="estimatedCostEur" fill="#fb7185" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </section>
  );
}
