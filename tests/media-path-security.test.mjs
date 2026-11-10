import { test } from "node:test";
import assert from "node:assert/strict";
import { isOwnedLegacyMediaPath } from "../supabase/functions/media/ownership.mjs";

test("permite al usuario descargar sus archivos heredados", () => {
  assert.equal(isOwnedLegacyMediaPath("member-1/12345678-1234-1234-1234-123456789abc.jpg", "member-1"), true);
});

test("bloquea archivos heredados pertenecientes a otra cuenta", () => {
  assert.equal(isOwnedLegacyMediaPath("member-2/12345678-1234-1234-1234-123456789abc.jpg", "member-1"), false);
});

test("bloquea rutas anidadas y traversal", () => {
  assert.equal(isOwnedLegacyMediaPath("member-1/private/12345678-1234-1234-1234-123456789abc.jpg", "member-1"), false);
  assert.equal(isOwnedLegacyMediaPath("../member-1/12345678-1234-1234-1234-123456789abc.jpg", "member-1"), false);
});

test("rechaza rutas y UID inválidos", () => {
  assert.equal(isOwnedLegacyMediaPath("", "member-1"), false);
  assert.equal(isOwnedLegacyMediaPath("member-1/not-a-uuid.jpg", "member-1"), false);
  assert.equal(isOwnedLegacyMediaPath("member-1/12345678-1234-1234-1234-123456789abc.jpg", ""), false);
});
