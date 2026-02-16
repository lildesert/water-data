import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./app/lib/server/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "./data/water.sqlite",
  },
});
