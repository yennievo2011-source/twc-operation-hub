import { test } from "node:test";
import assert from "node:assert";
import { post } from "./helpers.js";

test("digest requires posts array", async () => {
  const r = await post("/digest", {});
  assert.equal(r.status, 400);
});
