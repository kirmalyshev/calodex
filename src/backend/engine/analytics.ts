// The analytics context (ieat-app#3196): what a request says about the binary that sent it, and
// what the server knows about the account. Both are read here and nowhere else, so the funnel rows,
// `ProfileResponse.analytics` and every client's super properties agree.
import {
  APP_HEADER, BUILD_HEADER, CHANNEL_HEADER, UPDATE_HEADER, VERSION_HEADER, parseApp, parseChannel, parseClientTag,
  type AnalyticsContext, type AnalyticsSurface,
} from "@eait/shared";

export type AnalyticsRequest = Pick<AnalyticsContext, "surface" | "brand" | "app_version" | "build" | "ota_update_id" | "channel">;

/** CLIENT-REPORTED: labels rows, gates nothing. A value a parser refuses is null, never stored. */
export function analyticsRequestOf(headers: Headers, surface: AnalyticsSurface): AnalyticsRequest {
  return {
    surface,
    brand: parseApp(headers.get(APP_HEADER)),
    channel: parseChannel(headers.get(CHANNEL_HEADER)),
    app_version: parseClientTag(headers.get(VERSION_HEADER)),
    build: parseClientTag(headers.get(BUILD_HEADER)),
    ota_update_id: parseClientTag(headers.get(UPDATE_HEADER)),
  };
}
