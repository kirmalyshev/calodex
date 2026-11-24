// AGENTS.md lists, per surface, the exports an iOS client renders from. A name there that nothing
// exports is a client author's compile error, so this pins every listed name to a real export.
import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? (e.name === "node_modules" ? [] : walk(join(d, e.name))) : [join(d, e.name)]);
const source = walk(import.meta.dir)
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
  .map((f) => readFileSync(f, "utf8")).join("\n");

const doc = readFileSync(join(import.meta.dir, "AGENTS.md"), "utf8");
// Only names in list position (after `:*`, `,`, `/`, `+`) count; prose mentions like "reads `content`" do not.
// Paragraphs that open with `  *Onboarding:*`, `*Chat:*`, `*Health:*`, `*Notifications:*` or `*Every figure and date:*`.
const LISTS = /^ {2}\*(?:Onboarding|Chat|Health|Notifications|Every figure and date):\*[\s\S]*?(?=\n\s*\n)/gm;
const listed = [...new Set([...doc.matchAll(LISTS)].flatMap((m) =>
  [...m[0].matchAll(/(?<=(?::\*|,|\/|\+|\*\*) ?)`([A-Za-z_]\w*)[`(\[]/g)].map((n) => n[1]!)))];

test("every name in the iOS list is an export", () => {
  expect(listed.length).toBeGreaterThan(30);
  const missing = listed.filter((n) =>
    !new RegExp(`export\\s+(?:declare\\s+)?(?:const|let|function|type|interface|class|enum)\\s+${n}\\b`).test(source));
  expect(missing).toEqual([]);
});
