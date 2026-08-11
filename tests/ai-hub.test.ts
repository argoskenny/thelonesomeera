import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { aiHubCollections, aiHubDemoCount } from "../src/data/ai-hub-demos";
import { demos } from "../src/data/demos";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("AI Hub is an internal Demo entry", () => {
  const aiHub = demos.find((demo) => demo.title === "AI Hub");

  assert.ok(aiHub);
  assert.equal(aiHub.href, "/demo/ai-hub");
  assert.equal(aiHub.external, false);
  assert.equal(
    existsSync(path.join(repoRoot, "public/images/ai-hub-card.png")),
    true,
  );
});

test("AI Hub only publishes non-empty static experiments", () => {
  assert.equal(aiHubCollections.length, 7);
  assert.equal(aiHubDemoCount, 32);

  const hrefs = new Set<string>();

  for (const collection of aiHubCollections) {
    assert.ok(collection.demos.length > 0, `${collection.id} should have demos`);

    for (const demo of collection.demos) {
      assert.equal(hrefs.has(demo.href), false, `${demo.href} should be unique`);
      hrefs.add(demo.href);

      const target = resolvePublicTarget(demo.href);
      assert.equal(existsSync(target), true, `${demo.href} should exist`);
      assert.ok(statSync(target).size > 0, `${demo.href} should not be empty`);
    }
  }

  assert.equal(hrefs.has("/showcase/cybermessager/grok.html"), false);
  assert.equal(hrefs.has("/showcase/blackhole/kimi.html"), false);
});

test("AI Hub preserves the complete prompts from the original experiments", () => {
  const prompts = new Map(
    aiHubCollections.map((collection) => [collection.id, collection.prompt]),
  );

  assert.equal(prompts.get("signup"), undefined);
  assert.equal(prompts.get("room"), undefined);
  assert.equal(
    prompts.get("solar-system"),
    "請使用 HTML 前端技術，製作一個模擬太陽系的網頁，相關程式請集中在一個 html 檔案內",
  );
  assert.equal(
    prompts.get("earth-moon"),
    "製作一個單頁式的HTML，內容是模擬地球與月球運行的系統，要使用前端的3D技術來製作",
  );
  assert.match(prompts.get("black-hole") ?? "", /Please follow these principles:/);
  assert.match(prompts.get("black-hole") ?? "", /insurmountable technical limitations/);
  assert.match(prompts.get("cyber-messenger") ?? "", /provide a concise checklist/);

  const fpsPrompt = prompts.get("fps-lab") ?? "";
  assert.ok(fpsPrompt.length > 3_000);
  assert.match(fpsPrompt, /## Core Constraint/);
  assert.match(fpsPrompt, /## Architecture Requirement \(within one HTML\)/);
  assert.match(fpsPrompt, /## Acceptance Criteria \(Must Pass All\)/);
  assert.match(fpsPrompt, /## Output Format/);
});

function resolvePublicTarget(href: string) {
  const relativeHref = href.replace(/^\//, "");
  const directTarget = path.join(repoRoot, "public", relativeHref);

  if (path.extname(directTarget)) {
    return directTarget;
  }

  return path.join(directTarget, "index.html");
}
