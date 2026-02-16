import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("healthz", "routes/healthz.tsx"),
  route("entry", "routes/entry.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("bills", "routes/bills.tsx"),
  route("import", "routes/import.tsx"),
] satisfies RouteConfig;
