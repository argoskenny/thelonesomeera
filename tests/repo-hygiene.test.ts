import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("root lint has a checked-in ESLint configuration", () => {
  assert.ok(existsSync(path.join(repoRoot, "eslint.config.mjs")));
});

test("root lint runs through the ESLint CLI", () => {
  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  );
  assert.equal(packageJson.scripts.lint, "eslint .");
});

test("TypeScript incremental build info is ignored and not tracked", () => {
  const gitignore = readFileSync(path.join(repoRoot, ".gitignore"), "utf8");
  assert.match(gitignore, /^tsconfig\.tsbuildinfo$/m);
});

test("rendering does not depend on runtime Google Fonts imports", () => {
  for (const relativePath of ["src/app/globals.css", "public/blog/article.css"]) {
    const stylesheet = readFileSync(path.join(repoRoot, relativePath), "utf8");
    assert.doesNotMatch(stylesheet, /fonts\.googleapis\.com/);
    assert.doesNotMatch(stylesheet, /^@import\s+url/m);
  }
});

test("production showcase bundles do not publish source maps", () => {
  for (const project of ["colorful_kart", "mini_fantasy", "room"]) {
    const config = readFileSync(
      path.join(repoRoot, "showcase", project, "vite.config.ts"),
      "utf8",
    );
    assert.match(config, /sourcemap:\s*false/);
    assert.doesNotMatch(config, /sourcemap:\s*true/);

    const publishedFiles = listFiles(
      path.join(repoRoot, "public", "showcase", project),
    );
    assert.equal(
      publishedFiles.some((file) => file.endsWith(".map")),
      false,
      `${project} should not publish source maps`,
    );
  }
});

test("Android bridge test page has a source-backed publish path", () => {
  const source = readFileSync(
    path.join(repoRoot, "showcase/androidtest/public/bridge-test.html"),
    "utf8",
  );
  const published = readFileSync(
    path.join(repoRoot, "public/showcase/androidtest/bridge-test.html"),
    "utf8",
  );

  assert.equal(published, source);
});

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}
