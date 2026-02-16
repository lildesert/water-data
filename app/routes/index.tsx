import { redirect } from "react-router";

import type { Route } from "./+types/index";

export async function loader(_: Route.LoaderArgs) {
  return redirect("/entry");
}
