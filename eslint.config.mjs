import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "public/**",
    "androidtest/**",
    "cod2/**",
    "pulsesync/**",
    "sox/**",
    "tests/**",
    "next-env.d.ts",
  ]),
]);
