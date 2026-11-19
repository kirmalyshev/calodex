import { describe, expect, it } from "bun:test";
import { APP_HEADER, BUILD_HEADER, CHANNEL_HEADER, UPDATE_HEADER, VERSION_HEADER } from "@eait/shared";
import { analyticsRequestOf } from "./analytics.ts";

describe("analyticsRequestOf (ieat-app#3196)", () => {
  it("reads the binary's own headers", () => {
    const h = new Headers({
      [APP_HEADER]: "eait", [CHANNEL_HEADER]: "testflight",
      [VERSION_HEADER]: "1.4.2", [BUILD_HEADER]: "187", [UPDATE_HEADER]: "0b1c2d3e-4f50",
    });
    expect(analyticsRequestOf(h, "app")).toEqual({
      surface: "app", brand: "eait", channel: "testflight", app_version: "1.4.2", build: "187", ota_update_id: "0b1c2d3e-4f50",
    });
  });

  it("is null where a header is absent or refused, and the brand is the default one", () => {
    const h = new Headers({ [CHANNEL_HEADER]: "sideload", [VERSION_HEADER]: "1.0 <b>", [BUILD_HEADER]: "x".repeat(200) });
    expect(analyticsRequestOf(h, "web")).toEqual({
      surface: "web", brand: "calodex", channel: null, app_version: null, build: null, ota_update_id: null,
    });
  });
});
