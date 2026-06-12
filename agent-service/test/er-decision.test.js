import { test } from "node:test";
import assert from "node:assert";
import { post } from "./helpers.js";

test("FB ER 6.5% -> BOOST", async () => {
  const r = await post("/er-decision", { post_id: "A1", platform: "FB+IG", er: 6.5, budget: 15 });
  assert.equal(r.status, 200);
  assert.equal(r.body.decision, "BOOST");
});

test("LinkedIn ER 1.5% -> STOP", async () => {
  const r = await post("/er-decision", { post_id: "A2", platform: "LinkedIn", er: 1.5, budget: 10 });
  assert.equal(r.body.decision, "STOP");
});

test("FB ER 2.1% -> KILL", async () => {
  const r = await post("/er-decision", { post_id: "A3", platform: "FB+IG", er: 2.1, budget: 15 });
  assert.equal(r.body.decision, "KILL");
});

test("LinkedIn ER 4% -> BOOST $30", async () => {
  const r = await post("/er-decision", { post_id: "A4", platform: "LinkedIn", er: 4, budget: 10 });
  assert.equal(r.body.decision, "BOOST");
  assert.equal(r.body.boost_amount, 30);
});

test("missing fields -> 400", async () => {
  const r = await post("/er-decision", { post_id: "A5" });
  assert.equal(r.status, 400);
});
