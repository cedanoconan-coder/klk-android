import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../sw.js", import.meta.url), "utf8");

test("navigation cache is bounded to the canonical app shell", () => {
  assert.match(source, /hasNavigationParameters\s*=\s*request\.mode\s*===\s*"navigate"\s*&&\s*url\.search\.length\s*>\s*0/);
  assert.match(source, /!hasNavigationParameters\)await cache\.put\("\.\/index\.html",fresh\.clone\(\)\)/);
  assert.doesNotMatch(source, /cache\.put\(request,fresh\.clone\(\)\);return fresh;\}catch\(error\)\{return \(await cache\.match\(request\)\)/);
});

test("invitation URLs are excluded and offline fallback stays available", () => {
  assert.match(source, /url\.searchParams\.has\("invite"\)/);
  assert.match(source, /await cache\.match\("\.\/index\.html"\)/);
});

test("private and cross-origin requests are not intercepted", () => {
  assert.match(source, /request\.method\s*!==\s*"GET"/);
  assert.match(source, /url\.origin\s*!==\s*self\.location\.origin/);
});
