import { test } from "node:test";
import assert from "node:assert";
import { get } from "./helpers.js";

test("health returns ok", async () => {
  const r = await get("/health");
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
});
