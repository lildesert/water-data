import { data } from "react-router";

import { listRecentReadings } from "~/lib/server/queries";

import type { Route } from "./+types/healthz";

export async function loader(_: Route.LoaderArgs) {
  await listRecentReadings(1);
  return data({ ok: true, timestamp: new Date().toISOString() });
}
