import { Form, redirect, useActionData, useLoaderData } from "react-router";

import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { compareBill, getEffectiveRate } from "~/lib/domain/calc";
import { formatEur, formatM3 } from "~/lib/domain/format";
import {
  addBill,
  deleteBill,
  latestBill,
  listAllReadings,
  listBills,
} from "~/lib/server/queries";

import type { Route } from "./+types/bills";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Bills | Water Tracker" }];
}

export async function loader(_: Route.LoaderArgs) {
  const [bills, readings, lastBill] = await Promise.all([
    listBills(),
    listAllReadings(),
    latestBill(),
  ]);

  const rate = getEffectiveRate(lastBill);

  const comparisons = bills.map((bill) => ({
    bill,
    ...compareBill(readings, bill, rate),
  }));

  return { bills, comparisons };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "add");

  if (intent === "delete") {
    const id = String(formData.get("id") || "");
    if (id) await deleteBill(id);
    return redirect("/bills");
  }

  const periodStart = String(formData.get("periodStart") || "");
  const periodEnd = String(formData.get("periodEnd") || "");
  const officialVolumeM3 = Number(formData.get("officialVolumeM3") || 0);
  const officialTotalEur = Number(formData.get("officialTotalEur") || 0);
  const providerName = String(formData.get("providerName") || "");
  const notes = String(formData.get("notes") || "");

  if (!periodStart || !periodEnd || periodEnd <= periodStart) {
    return { error: "Provide a valid bill period." };
  }

  if (
    Number.isNaN(officialVolumeM3) ||
    Number.isNaN(officialTotalEur) ||
    officialVolumeM3 <= 0 ||
    officialTotalEur <= 0
  ) {
    return { error: "Official volume and amount must be positive." };
  }

  await addBill({
    periodStart,
    periodEnd,
    officialVolumeM3,
    officialTotalEur,
    providerName,
    notes,
  });

  return redirect("/bills");
}

export default function BillsRoute() {
  const { comparisons } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <section className="space-y-5 pb-24">
      <Card className="bg-violet-100">
        <CardTitle>Add Bi-Annual Bill</CardTitle>
        <CardDescription className="mt-1">
          Enter official bill data to compare against your tracking and estimate deltas.
        </CardDescription>

        <Form method="post" className="mt-4 grid gap-3">
          <input type="hidden" name="intent" value="add" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="periodStart">Period start</Label>
              <Input id="periodStart" name="periodStart" type="date" required />
            </div>
            <div>
              <Label htmlFor="periodEnd">Period end</Label>
              <Input id="periodEnd" name="periodEnd" type="date" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="officialVolumeM3">Official volume (m3)</Label>
              <Input id="officialVolumeM3" name="officialVolumeM3" type="number" step="0.01" required />
            </div>
            <div>
              <Label htmlFor="officialTotalEur">Official total (EUR)</Label>
              <Input id="officialTotalEur" name="officialTotalEur" type="number" step="0.01" required />
            </div>
          </div>

          <div>
            <Label htmlFor="providerName">Provider</Label>
            <Input id="providerName" name="providerName" type="text" placeholder="Water company" />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" type="text" placeholder="optional" />
          </div>

          {actionData?.error ? (
            <p className="rounded-xl border-2 border-black bg-rose-100 p-2 text-sm font-semibold text-rose-900">
              {actionData.error}
            </p>
          ) : null}

          <Button type="submit" className="w-full">
            Save bill
          </Button>
        </Form>
      </Card>

      <Card>
        <CardTitle>Comparison History</CardTitle>
        <div className="mt-3 space-y-3">
          {comparisons.length === 0 ? (
            <CardDescription>No bill recorded yet.</CardDescription>
          ) : (
            comparisons.map((item) => (
              <div key={item.bill.id} className="rounded-xl border border-black/20 bg-zinc-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {item.bill.periodStart} {"->"} {item.bill.periodEnd}
                    </p>
                    <p className="text-sm text-zinc-700">
                      Tracked {formatM3(item.estimatedVolumeM3)} vs official {formatM3(item.bill.officialVolumeM3)}
                    </p>
                    <p className="text-sm text-zinc-700">
                      Est. {formatEur(item.estimatedCostEur)} vs official {formatEur(item.bill.officialTotalEur)}
                    </p>
                    <p className="text-sm font-semibold">
                      Delta: {formatM3(item.volumeDeltaM3)} / {formatEur(item.costDeltaEur)}
                    </p>
                  </div>
                  <Form method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={item.bill.id} />
                    <Button variant="ghost" size="sm" type="submit">
                      Delete
                    </Button>
                  </Form>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
