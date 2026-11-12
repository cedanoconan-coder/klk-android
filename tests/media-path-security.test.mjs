import { test } from "node:test";
import assert from "node:assert/strict";
import { isOwnedLegacyMediaPath, isStatusMediaPathForOwner } from "../supabase/functions/media/ownership.mjs";

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

test("acepta solo rutas de estado que pertenecen al UID declarado", () => {
  const path = "statuses/member-1/12345678-1234-1234-1234-123456789abc.jpg";
  assert.equal(isStatusMediaPathForOwner(path, "member-1"), true);
  assert.equal(isStatusMediaPathForOwner(path, "member-2"), false);
  assert.equal(isStatusMediaPathForOwner("statuses/member-1/archivo.jpg", "member-1"), false);
  assert.equal(isStatusMediaPathForOwner("statuses/member-1/nested/12345678-1234-1234-1234-123456789abc.jpg", "member-1"), false);
});
