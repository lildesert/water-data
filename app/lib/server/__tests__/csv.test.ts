import assert from "node:assert/strict";
import test from "node:test";

import { parseReadingsCsv } from "../csv";

test("parseReadingsCsv parses standard comma CSV", () => {
  const csv = `date,meter_index\n2026-01-01,100.2\n2026-01-08,101.1`;
  const parsed = parseReadingsCsv(csv);

  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rejected, 0);
});

test("parseReadingsCsv parses quoted semicolon CSV", () => {
  const csv = '"date";"meter index"\n"01/01/2026";"100,5"';
  const parsed = parseReadingsCsv(csv);

  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0]?.readingDate, "2026-01-01");
  assert.equal(parsed.rows[0]?.meterIndexM3, 100.5);
});
