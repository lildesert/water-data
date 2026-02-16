import Papa from "papaparse";

export type ParsedReadingRow = {
  readingDate: string;
  meterIndexM3: number;
  notes?: string;
};

function normalizeDate(raw: string) {
  const v = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const fr = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fr) {
    const dd = fr[1].padStart(2, "0");
    const mm = fr[2].padStart(2, "0");
    return `${fr[3]}-${mm}-${dd}`;
  }
  return null;
}

function normalizeNumber(raw: string) {
  const cleaned = raw.trim().replace(/\s/g, "").replace(",", ".");
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

function findColumn(headers: string[], candidates: string[]) {
  return headers.findIndex((h) => candidates.some((c) => h.includes(c)));
}

export function parseReadingsCsv(csvText: string) {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const fields = parsed.meta.fields ?? [];
  const dateIdx = findColumn(fields, ["date"]);
  const meterIdx = findColumn(fields, ["meter", "index", "volume", "m3"]);
  const notesIdx = findColumn(fields, ["notes", "note", "comment", "comments"]);

  if (dateIdx < 0 || meterIdx < 0) {
    return {
      rows: [] as ParsedReadingRow[],
      rejected: parsed.data.length,
      errors: [
        "Could not detect date and meter columns. Use headers like date,meter_index.",
      ],
    };
  }

  const dateField = fields[dateIdx]!;
  const meterField = fields[meterIdx]!;
  const notesField = notesIdx >= 0 ? fields[notesIdx]! : null;

  const rows: ParsedReadingRow[] = [];
  let rejected = 0;

  for (const row of parsed.data) {
    const readingDate = normalizeDate(String(row[dateField] ?? ""));
    const meterIndexM3 = normalizeNumber(String(row[meterField] ?? ""));
    const rawNotes = notesField ? String(row[notesField] ?? "").trim() : "";

    if (!readingDate || meterIndexM3 === null) {
      rejected += 1;
      continue;
    }

    rows.push({
      readingDate,
      meterIndexM3,
      notes: rawNotes.length > 0 ? rawNotes : undefined,
    });
  }

  return {
    rows,
    rejected,
    errors: parsed.errors.map((e) => e.message),
  };
}
