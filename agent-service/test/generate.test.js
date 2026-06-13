import { test } from "node:test";
import assert from "node:assert";
import { post } from "./helpers.js";

test("generate requires post body", async () => {
  const r = await post("/generate", {});
  assert.equal(r.status, 400);
});

test("generate requires post_id", async () => {
  const r = await post("/generate", { post: { audience: "b2c" } });
  assert.equal(r.status, 400);
});
