import { Droplets, Gauge, Plus } from "lucide-react";
import { Form, redirect, useActionData, useLoaderData } from "react-router";

import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { formatM3 } from "~/lib/domain/format";
import {
  addReading,
  deleteReading,
  getLatestReading,
  listRecentReadings,
} from "~/lib/server/queries";

import type { Route } from "./+types/entry";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Quick Entry | Water Tracker" }];
}

export async function loader(_: Route.LoaderArgs) {
  const latest = await getLatestReading();
  const recentReadings = await listRecentReadings(14);

  return {
    today: new Date().toISOString().slice(0, 10),
    latest,
    recentReadings,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "add");

  if (intent === "delete") {
    const id = String(formData.get("id") || "");
    if (id) {
      await deleteReading(id);
    }
    return redirect("/entry");
  }

  const readingDate = String(formData.get("readingDate") || "");
  const meterIndexM3 = Number(formData.get("meterIndexM3") || 0);
  const notes = String(formData.get("notes") || "");

  if (!readingDate || Number.isNaN(meterIndexM3) || meterIndexM3 < 0) {
    return { error: "Provide a valid date and meter index." };
  }

  const latest = await getLatestReading();
  if (latest && meterIndexM3 < latest.meterIndexM3) {
    return {
      error: `Meter index must be greater than or equal to previous value (${latest.meterIndexM3}).`,
    };
  }

  try {
    await addReading({ readingDate, meterIndexM3, notes, source: "manual" });
  } catch {
    return { error: "A reading already exists for this date." };
  }

  return redirect("/entry");
}

export default function EntryRoute() {
  const { today, latest, recentReadings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <section className="space-y-5 pb-24">
      <Card className="bg-cyan-100">
        <div className="mb-3 flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          <CardTitle>Quick Meter Check</CardTitle>
        </div>
        <CardDescription>
          Date defaults to today. Meter value starts from your previous reading so you can quickly bump it.
        </CardDescription>

        <Form method="post" className="mt-4 grid gap-3">
          <input type="hidden" name="intent" value="add" />
          <div>
            <Label htmlFor="readingDate">Date</Label>
            <Input id="readingDate" name="readingDate" type="date" required defaultValue={today} />
          </div>
          <div>
            <Label htmlFor="meterIndexM3">Meter index (m3)</Label>
            <Input
              id="meterIndexM3"
              name="meterIndexM3"
              type="number"
              inputMode="decimal"
              step="0.01"
              required
              defaultValue={latest?.meterIndexM3 ?? ""}
              placeholder="ex: 1254.30"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" name="notes" type="text" placeholder="weekly check" />
          </div>

          {actionData?.error ? (
            <p className="rounded-xl border-2 border-black bg-rose-100 p-2 text-sm font-semibold text-rose-900">
              {actionData.error}
            </p>
          ) : null}

          <Button type="submit" className="mt-1 w-full" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Save reading
          </Button>
        </Form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          <CardTitle>Recent Readings</CardTitle>
        </div>

        <div className="space-y-2">
          {recentReadings.length === 0 ? (
            <CardDescription>No reading yet. Add your first one above.</CardDescription>
          ) : (
            recentReadings.map((reading) => (
              <div
                key={reading.id}
                className="flex items-center justify-between rounded-xl border border-black/20 bg-zinc-50 px-3 py-2"
              >
                <div>
                  <p className="font-semibold">{reading.readingDate}</p>
                  <p className="text-sm text-zinc-600">{formatM3(reading.meterIndexM3)}</p>
                </div>
                <Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="id" value={reading.id} />
                  <Button variant="ghost" size="sm" type="submit">
                    Delete
                  </Button>
                </Form>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
