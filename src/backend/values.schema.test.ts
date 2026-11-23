// `VALUE_KEYS` is what the code reads; the `admin_values` check constraint is what the database
// accepts. Written out by hand in both places so they CAN disagree and this test can say so
// (the same reasoning as switches.schema.test.ts and llm/prompt.schema.test.ts).

import { expect, test } from "bun:test";
import { VALUE_KEYS } from "./store.ts";
import { SCHEMA } from "./store.pg.ts";

function keysInSchema(): string[] {
  expect(SCHEMA, "no `admin_values` table in the Postgres schema").toContain("create table if not exists admin_values");
  const check = /add constraint admin_values_key_check\s*\n?\s*check \(key in \(([^)]*)\)\)/.exec(SCHEMA);
  expect(check, "`admin_values` has no `admin_values_key_check` constraint").not.toBeNull();
  return [...check![1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
}

test("every value key the code reads has a home in the schema, and the schema holds no other", () => {
  expect([...keysInSchema()].sort()).toEqual([...VALUE_KEYS].sort());
});
