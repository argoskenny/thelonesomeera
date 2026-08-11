import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const removedPaths = [
  "src/lib/articlePayload.ts",
  "src/lib/auth.ts",
  "src/lib/helpers/imageStorage.ts",
  "src/lib/prisma.ts",
  "src/lib/services/AIArticleService.ts",
  "src/lib/services/AIImageService.ts",
  "src/lib/uploadValidation.ts",
  "src/components/ui/MarkdownContent.tsx",
  "src/proxy.ts",
  "prisma/schema.prisma",
  "prisma/seed.ts",
  "scripts/prepare-prisma-engine.mjs",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "public/index.html",
  "public/app.js",
  "public/ai-hub.html",
  "public/stock.html",
  "public/test.html",
  "public/selfiecat_tickets.html",
  "public/uploads/.gitkeep",
  "public/tle_logo.png",
  "public/googleplay_badge.png",
  "public/assets/imgs/blog_icon.png",
  "src/lib/projects.ts",
  "src/lib/ai-hub-data.ts",
  "src/lib/utils.ts",
];

const removedDirectories = [
  "src/app/admin",
  "src/app/api",
  "src/components/admin",
  "src/app/(site)/articles",
  "src/app/(site)/projects",
  "src/app/(site)/ai-hub",
];

const removedPackages = [
  "@prisma/client",
  "autoprefixer",
  "jose",
  "openai",
  "postcss",
  "prisma",
  "react-markdown",
  "remark-gfm",
  "shiki",
  "tailwindcss",
  "turndown",
];

test("removed backend and styling-tool paths do not return", () => {
  for (const relativePath of removedPaths) {
    assert.equal(
      existsSync(path.join(repoRoot, relativePath)),
      false,
      `${relativePath} should not exist`,
    );
  }

  for (const relativePath of removedDirectories) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (existsSync(absolutePath)) {
      const files = readdirSync(absolutePath, {
        recursive: true,
        withFileTypes: true,
      }).filter((entry) => entry.isFile());
      assert.deepEqual(
        files,
        [],
        `${relativePath} should not contain files`,
      );
    }
  }
});

test("root package has no removed backend or styling dependencies", () => {
  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  );
  const declaredPackages = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.optionalDependencies,
  };

  for (const packageName of removedPackages) {
    assert.equal(
      declaredPackages[packageName],
      undefined,
      `${packageName} should not be declared`,
    );
  }

  for (const script of Object.values(packageJson.scripts) as string[]) {
    assert.doesNotMatch(script, /prisma|db:(?:generate|push|seed|studio)/i);
  }

  assert.match(
    packageJson.scripts.build,
    /prepare-standalone-assets\.mjs/,
    "the standard build should package public and Next static assets",
  );
  assert.equal(
    packageJson.scripts.start,
    "node .next/standalone/server.js",
  );
});

test("runtime and deployment configs do not reference removed server state", () => {
  const configText = [
    "deploy.sh",
    "ecosystem.config.js",
    "next.config.mjs",
  ]
    .map((relativePath) =>
      readFileSync(path.join(repoRoot, relativePath), "utf8"),
    )
    .join("\n");

  for (const removedMarker of [
    "ADMIN_PASSWORD",
    "JWT_SECRET",
    "DATABASE_URL",
    "DB_FILE",
    "ARTICLE_COUNT",
    "@prisma/client",
    "prisma generate",
    "prisma db",
    "adminSecurityHeaders",
    "apiSecurityHeaders",
  ]) {
    assert.doesNotMatch(configText, new RegExp(removedMarker, "i"));
  }
});

test("ignored legacy data stays protected from deploy-time git clean", () => {
  const gitignore = readFileSync(path.join(repoRoot, ".gitignore"), "utf8");

  assert.match(gitignore, /^prisma\/production\.db$/m);
  assert.match(gitignore, /^public\/uploads\/\*$/m);
});
