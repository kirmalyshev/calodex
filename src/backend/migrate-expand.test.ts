// Migrations are EXPAND, then CONTRACT a release later (ieat-app#3108; src/backend/AGENTS.md,
// "A migration is EXPAND now").
// A deploy rolls one replica at a time: the new one runs `migrate()` at boot while the previous
// build still serves on the other, so every statement must be one the PREVIOUS build survives.
// Dropping, renaming, retyping or tightening something it reads breaks live requests mid-deploy.
// Dropping a constraint or an index LOOSENS and is not checked here.
//
// The statements below shipped either as the contract half of a finished expand, after no serving
// build read what they remove, or as a drop the very next statement recreates. A new one is added here deliberately, in a PR whose description
// names the release that stopped reading it — never to make this test pass.

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CONTRACTED = [
  "alter table users alter column referral_code set not null",
  "alter table tokens drop column token",
  "alter table tokens alter column token_hash set not null",
  "alter table tokens alter column last_used_at set not null",
  "drop table if exists jobs",
  "drop view if exists job_rows", // recreated by the next statement, same columns
  "drop table if exists subscribers",
];

const DESTRUCTIVE =
  /\b(drop\s+(column|table|type|function|view)|rename\s+(column\s+)?\w+\s+to|rename\s+to|alter\s+column\s+\w+\s+(set\s+data\s+)?type|set\s+not\s+null|add\s+column\b(?![^;]*\bdefault\b)[^;]*\bnot\s+null)\b/i;

test("no migration statement the previous build cannot survive, unless deliberately contracted", () => {
  const src = readFileSync(join(import.meta.dir, "store.pg.ts"), "utf8");
  const found = src
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*|--)/.test(l) && DESTRUCTIVE.test(l))
    .map((l) => l.trim().replace(/;$/, "").replace(/\s+/g, " "));
  expect(found).toEqual(CONTRACTED);
});

test("the pattern catches what the previous build cannot survive, and passes what it can", () => {
  for (const bad of ["alter table m add column x int not null", "alter table m rename column a to b",
    "alter table m alter column a type bigint", "alter table m drop column a"])
    expect(DESTRUCTIVE.test(bad)).toBe(true);
  for (const ok of ["alter table m add column x int not null default 0", "alter table m add column x int",
    "alter table m drop constraint m_kind_check", "create table if not exists t (id int not null)"])
    expect(DESTRUCTIVE.test(ok)).toBe(false);
});
