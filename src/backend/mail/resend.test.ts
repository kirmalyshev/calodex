import { afterEach, expect, spyOn, test } from "bun:test";
import { installBrandSource, withBrand } from "../brand.ts";
import { resendMail } from "./resend.ts";

// ieat-app#3154: EAIT__BACKEND__MAIL_FROM is the DEFAULT brand's sender, so a self-hosted
// instance's verified address is what its mail carries; another brand sends as its own.
installBrandSource();
let spy: ReturnType<typeof spyOn> | undefined;
afterEach(() => spy?.mockRestore());

const fromOf = async (run: (send: () => Promise<void>) => Promise<void>): Promise<string> => {
  let body = "";
  spy = spyOn(globalThis, "fetch").mockImplementation((async (_u: unknown, init?: RequestInit) => {
    body = String(init?.body);
    return new Response("{}", { status: 200 });
  }) as typeof fetch);
  const mail = resendMail({ apiKey: "k", from: "Self <login@self.example>" });
  await run(() => mail.sendSignInCode("a@b.example", "123456", "en"));
  return (JSON.parse(body) as { from: string }).from;
};

test("the default brand sends from the configured address", async () => {
  expect(await fromOf((send) => send())).toBe("Self <login@self.example>");
});

test("a request naming another brand sends as that brand", async () => {
  expect(await fromOf((send) => withBrand("eait", send))).toBe("eait <login@eait.fit>");
});

test("an instance that sets no sender sends as the default brand", async () => {
  const { configDefaults } = await import("../config.ts");
  const { BRANDS, DEFAULT_APP } = await import("@eait/shared");
  expect(configDefaults().mailFrom).toBe(BRANDS[DEFAULT_APP].mailFrom);
});
