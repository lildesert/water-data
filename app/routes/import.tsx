import { Form, useActionData } from "react-router";

import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardTitle } from "~/components/ui/card";
import { parseReadingsCsv } from "~/lib/server/csv";
import { addReading, listAllReadings } from "~/lib/server/queries";
import { enforceRateLimit, enforceSameOrigin } from "~/lib/server/security";

import type { Route } from "./+types/import";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Import | Water Tracker" }];
}

export async function action({ request }: Route.ActionArgs) {
  enforceSameOrigin(request);
  enforceRateLimit(request, "import-action", 20, 10 * 60_000);

  const formData = await request.formData();
  const file = formData.get("csvFile");

  if (!(file instanceof File)) {
    return { error: "Select a CSV file first." };
  }

  const text = await file.text();
  if (!text.trim()) {
    return { error: "CSV should include a header and at least one data row." };
  }
  const parsed = parseReadingsCsv(text);
  if (parsed.rows.length === 0) {
    return { error: parsed.errors[0] ?? "No valid rows found in CSV." };
  }

  const existing = new Set((await listAllReadings()).map((r) => r.readingDate));

  let imported = 0;
  let skipped = 0;
  let rejected = parsed.rejected;

  for (const row of parsed.rows) {
    const { readingDate, meterIndexM3, notes } = row;
    if (existing.has(readingDate)) {
      skipped += 1;
      continue;
    }

    try {
      await addReading({ readingDate, meterIndexM3, notes, source: "import" });
      existing.add(readingDate);
      imported += 1;
    } catch {
      rejected += 1;
    }
  }

  return {
    imported,
    skipped,
    rejected,
    parserWarnings: parsed.errors.length,
  };
}

export default function ImportRoute() {
  const actionData = useActionData<typeof action>();

  return (
    <section className="space-y-5 pb-24">
      <Card className="bg-orange-100">
        <CardTitle>Import Historical CSV</CardTitle>
        <CardDescription className="mt-1">
          Export from Google Sheets as CSV. We auto-detect date and meter/index columns.
        </CardDescription>

        <Form method="post" encType="multipart/form-data" className="mt-4 space-y-3">
          <input
            type="file"
            name="csvFile"
            accept=".csv,text/csv"
            className="block w-full rounded-xl border-2 border-dashed border-black bg-white p-3 text-sm"
          />
          <Button type="submit" className="w-full">
            Import file
          </Button>
        </Form>

        {actionData?.error ? (
          <p className="mt-3 rounded-xl border-2 border-black bg-rose-100 p-2 text-sm font-semibold text-rose-900">
            {actionData.error}
          </p>
        ) : null}

        {actionData && "imported" in actionData ? (
          <div className="mt-3 rounded-xl border-2 border-black bg-lime-100 p-3 text-sm font-semibold">
            Imported: {actionData.imported} | Skipped: {actionData.skipped} | Rejected: {actionData.rejected}
            {actionData.parserWarnings ? ` | Parser warnings: ${actionData.parserWarnings}` : ""}
          </div>
        ) : null}
      </Card>

      <Card>
        <CardTitle>CSV Template</CardTitle>
        <CardDescription className="mt-2">Use headers such as:</CardDescription>
        <pre className="mt-3 overflow-auto rounded-xl border bg-zinc-950 p-3 text-xs text-zinc-100">
{`date,meter_index\n2026-01-03,1142.2\n2026-01-17,1147.8`}
        </pre>
      </Card>
    </section>
  );
}
