// The backend admin: edit onboarding copy, read the funnel.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// FOUR RULES, ALL OF THEM SECURITY
//
// Rewritten in #391b, when the admin stopped being a shared secret typed into a box and became a
// ROLE AN ACCOUNT CARRIES. Three of the four changed meaning and one was retired outright; the
// replacements are not weaker, and saying which is which is the point of writing them down.
//
//  1. OFF UNLESS SOMEBODY HOLDS THE ROLE. `store.hasAdmin()` is false and every path here answers
//     404 — not 403, because "there is an admin and you cannot have it" is information. This is
//     stronger than the variable it replaces: deleting the last admin account switches the surface
//     off, which no environment variable could do.
//  2. THE ROLE IS GRANTED OUT OF BAND, AND ONLY OUT OF BAND. Nothing reachable over HTTP writes
//     `users.role`. It is set at boot from `EAIT__BACKEND__ADMIN_BOOTSTRAP_USER_ID` — a user id,
//     never a provider subject, because `identities` is keyed (provider, subject) and a device
//     identity's subject is any string a client chose. It is not on `Profile`, so `patchProfile`
//     cannot reach it in either store implementation; it is not in the column list `mergeUsers`
//     copies, so an anonymous session cannot carry a grant into somebody else's account.
//  3. THE CHECK IS `=== "admin"`, NEVER `!== "user"`. The negative form reads a missing role as an
//     admin, and a missing role is what a new field, a new store or a bad migration produces.
//     (This replaces the constant-time comparison, which had nothing left to compare: a bearer is
//     looked up by SHA-256 in `auth/tokens.ts`, and that lookup is the timing-safe one now.)
//  4. VALIDATED ON THE WRITE. Unchanged. `saveOnboardingContent` refuses copy the app cannot
//     render. Broken content that reached a phone is a broken onboarding for that user until the
//     next fetch, and no amount of client tolerance recovers the screen they were on.
//
// WHAT THIS COST, STATED RATHER THAN DISCOVERED LATER: the admin used to be independent of user
// authentication entirely. It is now exactly as strong as Apple/Google verification plus the token
// store plus the merge logic — and `EAIT__BACKEND__APPLE_AUDIENCES` accepts the preview and dev
// bundle ids, so a development build signed in as the admin's Apple ID is the admin. That is the
// same person today. It stops being acceptable on the day real users' data is on this host, which
// is the day the audience list is meant to be revisited anyway.
//
// An ANONYMOUS request gets 401 and an ordinary SIGNED-IN one gets 404. The page below is public
// and already proves the route exists, so confusing the person who is allowed in buys nothing —
// but an identified ordinary user learning "there is an admin here and you are not it" is the one
// piece of information worth withholding.
//
// The page itself is served without a credential — it holds no data, it only offers a way in.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import {
  CAMPAIGN_STATUSES, CAMPAIGN_VARIANTS, DEFAULT_ORDER, ENTITLEMENT_STATES, REMOVABLE_PLACES, SINCE_LOG_BANDS, STREAK_BANDS, LANGS, LANG_LABEL, NOTIFICATION_IDS, NOTIFICATION_PLACEHOLDERS, ONBOARDING_SCREENS, SCREEN_FIELDS,
  SCREEN_OPTIONS, isCalendarDate, narrowLang, optionLabelIsData, screenIsOptional, type Lang,
} from "@eait/shared";
import {
  adminMetrics, adminRangeOf, adminSwitches, adminUserChat, adminUserDiary, adminUsers, adminUserSummary, adminWindowEcho, livePrompts,
  addOnboardingVariant, createOnboardingExperiment, onboardingContent,
  onboardingExperiments, saveOnboardingVariant, saveOnboardingVariantOrder, setOnboardingExperiment,
  startOnboardingExperiment, stopOnboardingExperiment,
  onboardingFunnel, promptHistory, PUSH_STATS_MAX_DAYS, referralAdminView, savePrompt,
  sendTestPush, pushOpenView, sendAdminPush,
  listPushTemplates, reviewPushTemplate, savePushTemplate,
  campaignOverview, createCampaign, dryRunCampaign, setCampaignStatus, setCampaignsKilled, testSendCampaign, updateCampaign,
  resetOnboardingContent, saveOnboardingContent, saveSwitch, setUserCap, userCap,
  type EngineDeps,
} from "../engine/index.ts";
import { adminPage } from "./admin.page.ts";

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const notFound = () => json({ error: "not found" }, 404);

/**
 * A calendar date, or nothing.
 *
 * The window is a dashboard control: an unparseable `from` falls back to the default rather than
 * becoming an error page, and it never reaches the store — `mealsSince` compares `date` as text,
 * so a string that is not a date is a comparison against arbitrary input.
 */
const isDate = (v: string | null): v is string => v !== null && isCalendarDate(v);

/**
 * The window a time-based admin endpoint was asked for (ieat-app#2776).
 *
 * `from`/`to` are instants — an ISO timestamp with a zone is what the page sends; either may be
 * absent, which is an open end. `?days=N` is the old spelling and stays: it clamps rather than
 * rejects, like `days` always did, and resolves to instants before the store so it sees ONE shape.
 * On an endpoint whose default is unbounded (`bounds: null`) nothing still means everything, but a
 * `days` ask names a window there too (#2779). An unparseable bound reads as open — a dashboard
 * control, not an error page — and a `from` after `to` is a legal ask that reads as empty.
 */
type RangeAsk = { days: number } | { from: Date | null; to: Date | null };
const RANGE_MIN_MS = Date.UTC(2000, 0, 1), RANGE_MAX_MS = Date.UTC(2100, 0, 1);

// `days` on an endpoint that defaults unbounded still clamps: to the widest bound any time-based
// endpoint takes, so an enormous ask reads as all time rather than resolving before the epoch.
const OPEN_RANGE_MAX_DAYS = 400;

function rangeParam(url: URL, bounds: { defaultDays: number; maxDays: number } | null): RangeAsk {
  const f = url.searchParams.get("from"), t = url.searchParams.get("to");
  // A bound outside 2000–2100 reads as open too: Postgres refuses a timestamp before 4713 BC and
  // `dateMinus` turns a 6-digit year into Invalid Date, so either was a 500 from a typed box.
  const instant = (v: string | null): Date | null => {
    if (v === null || v === "") return null;
    const ms = Date.parse(v);
    return Number.isNaN(ms) || ms < RANGE_MIN_MS || ms >= RANGE_MAX_MS ? null : new Date(ms);
  };
  if (f !== null || t !== null) return { from: instant(f), to: instant(t) };
  // `all` is how the page says "no bounds on purpose": with no params at all a bounded
  // endpoint falls back to its `days` default, so All time cannot just send nothing.
  if (url.searchParams.has("all")) return { from: null, to: null };
  // `?days=N` is the old spelling on EVERY time-based endpoint, the unbounded-by-default ones
  // included: a bare days ask there names a window too, while nothing still means everything
  // (#2779). An unparseable one is no ask — the unbounded default, like the bounded ones fall
  // back to theirs.
  if (bounds === null) {
    const raw = url.searchParams.get("days");
    if (raw === null) return { from: null, to: null };
    const days = Number(raw);
    return Number.isFinite(days)
      ? { days: Math.min(OPEN_RANGE_MAX_DAYS, Math.max(1, Math.round(days))) }
      : { from: null, to: null };
  }
  const raw = Number(url.searchParams.get("days") ?? bounds.defaultDays);
  const days = Number.isFinite(raw)
    ? Math.min(bounds.maxDays, Math.max(1, Math.round(raw)))
    : bounds.defaultDays;
  return { days };
}

/**
 * Which language's copy this request is about.
 *
 * Clamped rather than rejected, like `days` on the funnel: this is a dashboard control, and a
 * nonsense query string should show the English page rather than an error. English is also what
 * every pre-#358 bookmark asks for by asking for nothing.
 */
const editorLang = (url: URL): Lang => {
  const asked = url.searchParams.get("lang") ?? "";
  return (LANGS as readonly string[]).includes(asked) ? (asked as Lang) : "en";
};

/**
 * What the editor needs in order to render the right controls for each group.
 *
 * `fields` is the list the editor draws an ask box for, and it comes from `SCREEN_FIELDS` rather
 * than from whatever the stored copy happens to carry — so a question added in code shows up in the
 * admin as an empty box to fill rather than as a save that is refused for a reason nobody can see.
 *
 * `options` LEAVES OUT THE ONES CLDR NAMES, which today is every country but `other`. An editor
 * that drew those boxes would be asking an admin to type fifteen country names in each of eight
 * languages, for a label the renderer takes from the platform anyway — and the validator does not
 * require them, so the boxes would be optional, ignored and wrong within a release.
 */
function editorMeta() {
  return {
    screens: ONBOARDING_SCREENS.map((id) => ({
      id,
      optional: screenIsOptional(id),
      fields: SCREEN_FIELDS[id],
      options: (SCREEN_OPTIONS[id] ?? []).filter((v) => !optionLabelIsData(id, v)),
    })),
  };
}

/**
 * @param userId The account behind the request's bearer, or null if there is no valid one.
 *   Resolved by `routes.ts` — this module never reads a credential itself, and there is no second
 *   path from a request to an identity in this process.
 */
export async function adminRoutes(
  req: Request,
  url: URL,
  deps: EngineDeps,
  userId: string | null,
): Promise<Response> {
  // Rule 1. Nobody holds the role, so there is no such feature here.
  if (!await deps.store.hasAdmin()) return notFound();

  const { pathname } = url;

  // The page. No data on it, so no credential needed to fetch it.
  if (req.method === "GET" && (pathname === "/admin" || pathname === "/admin/")) {
    const nonce = crypto.randomUUID();
    return new Response(adminPage(nonce), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        // The page is inline-only and talks to its own origin. Saying so means a future edit that
        // reaches for a CDN fails loudly here rather than quietly shipping a third party an admin
        // token typed into this form.
        // A NONCE, NOT 'unsafe-inline' (#391b). This page holds a bearer for a real account now,
        // on an origin that also serves the web application and the API, so an injected script here
        // is worth every credential at once. The policy names the same nonce the page's one script
        // and one style carry, and nothing else can run.
        "content-security-policy":
          `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; `
          // `img-src data:` for the empty favicon in the head, and `blob:` for the photographs
          // (#375) — without the first, `default-src 'none'` refuses even the favicon, which is one
          // console error per page load.
          //
          // `blob:` AND NOT `'self'`: the panel fetches a photo with the bearer it already holds and
          // renders the bytes it got back, so nothing addressable ever exists. An `<img src>` on
          // this origin could not carry the credential anyway, and the alternative — a signed URL —
          // would put a second credential for the most sensitive thing this product holds into a
          // query string, which is where #372 measured one being written into a log in full.
          + "connect-src 'self'; font-src 'self'; img-src data: blob:; base-uri 'none'; form-action 'none'; "
          + "frame-ancestors 'none'",
        "referrer-policy": "no-referrer",
        "x-frame-options": "DENY",
      },
    });
  }

  // ── Rules 2 and 3 ─────────────────────────────────────────────────────────────────────────
  //
  // No credential at all: 401, with no hint about what was wrong. The route exists — the page above
  // proves that much — so hiding it here would only confuse the person who is allowed in.
  if (userId === null) return json({ error: "unauthorized" }, 401);

  // A credential that names an ordinary account: 404, the same answer an instance with no admin
  // gives. This person is IDENTIFIED, and "there is an admin here and you are not it" is the one
  // thing worth withholding from them.
  //
  // `=== "admin"` and never `!== "user"`: the negative form reads a missing role as an admin, and a
  // missing role is what a new field, a new store or a bad migration produces.
  if (await deps.store.roleOf(userId) !== "admin") return notFound();

  // ── The audit line (#443) ──────────────────────────────────────────────────────────────────
  //
  // One line per WRITE — the copy, the notification copy, both resets, the per-account cap —
  // naming the account, the route and what came of it. Reads would drown it. NEVER THE PAYLOAD: a
  // route and a subject id, never what changed, which is the hazard "errors are logged, never
  // returned" exists for. NEVER THE BEARER: `userId` is what it resolved to, and the path goes in
  // without its query string (#372).
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return await behindTheRole(req, url, deps, userId);
  let outcome: number | "threw" = "threw";
  try {
    const res = await behindTheRole(req, url, deps, userId);
    outcome = res.status;
    return res;
  } finally {
    console.log(`[eait] admin write: ${userId} ${req.method} ${pathname} -> ${outcome}`);
  }
}

/** Every route behind the role. `adminRoutes` is its only caller, and only after the check. */
async function behindTheRole(req: Request, url: URL, deps: EngineDeps, adminId: string): Promise<Response> {
  const { pathname } = url;

  // ── Onboarding copy ────────────────────────────────────────────────────────────────────────
  //
  // `?lang=` PICKS ONE LANGUAGE, AND THE EDITOR EDITS ONE AT A TIME. Eight tabs of one form is
  // eight times the JavaScript for a page that is already the largest hand-written one here; a
  // select that reloads is the same capability and is four lines of it. Absent or unknown is
  // English, so every bookmark that predates #358 still opens the page it used to.
  //
  // The SAVE carries the languages it is not editing (`saveOnboardingContent`), so two admins on
  // two languages cannot overwrite each other by taking turns.
  if (req.method === "GET" && pathname === "/admin/api/content") {
    const lang = editorLang(url);
    return json({ content: await onboardingContent(deps, lang), lang, langs: LANGS, labels: LANG_LABEL, meta: editorMeta() });
  }

  if (req.method === "PUT" && pathname === "/admin/api/content") {
    const body = await req.json() as { content?: unknown };
    const result = await saveOnboardingContent(deps, body?.content, editorLang(url));
    // 422 and the whole list, not the first failure: an editor that reports one problem per save
    // is an editor that takes six saves to fix six typos.
    return result.ok ? json({ content: result.content }) : json({ errors: result.errors }, 422);
  }

  if (req.method === "POST" && pathname === "/admin/api/content/reset") {
    return json({ content: await resetOnboardingContent(deps, editorLang(url)) });
  }

  // ── Push templates (#1758) ─────────────────────────────────────────────────────────────────
  //
  // Per key × language × variant, with a draft|reviewed status. `reviewed_by` is the admin ACCOUNT
  // id, never a name. A refusal is 422 with every error — the plural, placeholder and claims-gate
  // messages — so the editor shows the gate's own words.
  if (req.method === "GET" && pathname === "/admin/api/push-templates") {
    return json({
      ...(await listPushTemplates(deps)),
      langs: LANGS,
      meta: { placeholders: NOTIFICATION_PLACEHOLDERS },
    });
  }

  if (req.method === "PUT" && pathname === "/admin/api/push-templates") {
    const body = await req.json() as { template?: unknown; status?: unknown };
    const result = await savePushTemplate(deps, body?.template, body?.status, adminId);
    return result.ok ? json({ row: result.row }) : json({ errors: result.errors }, 422);
  }

  if (req.method === "POST" && pathname === "/admin/api/push-templates/review") {
    const body = await req.json() as { key?: unknown; lang?: unknown; variant?: unknown };
    const result = await reviewPushTemplate(deps, { key: body?.key, lang: body?.lang, variant: body?.variant }, adminId);
    return result.ok ? json({ row: result.row }) : json({ errors: result.errors }, 422);
  }

  // ── Push campaigns (ieat-app#1761) ─────────────────────────────────────────────────────────
  //
  // A segment is the allowlist in `@eait/shared` and nothing else: a predicate it does not name is a
  // 422 with the reason, never ignored. Status moves only along the machine in `engine/campaign.ts`;
  // scheduling needs a complete template. A test send and a dry run never take a campaign's one
  // send per account. The global kill switch is `POST /admin/api/campaigns/kill`.
  if (pathname === "/admin/api/campaigns") {
    if (req.method === "GET") {
      const ask = rangeParam(url, null);
      return json({
        ...(await campaignOverview(deps, "days" in ask ? ask.days : ask)),
        options: {
          langs: LANGS, variants: CAMPAIGN_VARIANTS, statuses: CAMPAIGN_STATUSES,
          entitlement: ENTITLEMENT_STATES, streakBands: STREAK_BANDS, sinceLog: SINCE_LOG_BANDS,
          staffCount: deps.config.campaignStaffIds.length,
        },
      });
    }
    if (req.method === "POST") {
      const result = await createCampaign(deps, await req.json().catch(() => null), adminId);
      return result.ok ? json({ row: result.row }) : json({ errors: result.errors }, 422);
    }
  }

  if (req.method === "POST" && pathname === "/admin/api/campaigns/kill") {
    const body = await req.json().catch(() => null) as { killed?: unknown } | null;
    if (typeof body?.killed !== "boolean") return json({ errors: ["killed must be true or false"] }, 422);
    await setCampaignsKilled(deps, body.killed);
    return json({ killed: body.killed });
  }

  const camp = pathname.match(/^\/admin\/api\/campaigns\/([\w-]{1,64})(?:\/(status|dry-run|test))?$/);
  if (camp) {
    const id = camp[1]!;
    const body = (req.method === "GET" ? null : await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (req.method === "PATCH" && camp[2] === undefined) {
      const result = await updateCampaign(deps, id, body ?? {});
      return result.ok ? json({ row: result.row }) : json({ errors: result.errors }, result.errors[0] === "no such campaign" ? 404 : 422);
    }
    if (req.method === "POST" && camp[2] === "status") {
      const to = body?.status;
      if (typeof to !== "string" || !(CAMPAIGN_STATUSES as readonly string[]).includes(to)) return json({ errors: ["unknown status"] }, 422);
      const result = await setCampaignStatus(deps, id, to as (typeof CAMPAIGN_STATUSES)[number]);
      return result.ok ? json({ row: result.row }) : json({ errors: result.errors }, result.errors[0] === "no such campaign" ? 404 : 422);
    }
    if (req.method === "POST" && camp[2] === "dry-run") {
      const out = await dryRunCampaign(deps, id);
      return json(out, out.ok ? 200 : out.reason === "no-such-campaign" ? 404 : 409);
    }
    if (req.method === "POST" && camp[2] === "test") {
      const out = await testSendCampaign(deps, id, typeof body?.userId === "string" ? body.userId : "");
      return json(out, out.ok ? 200 : out.reason === "no-such-campaign" ? 404 : 409);
    }
  }

  // ── The system prompts ─────────────────────────────────────────────────────────────────────
  //
  // API ONLY. `admin.page.ts` has no prompts panel yet, so these two are reached with a bearer and
  // curl; every comment here says "the caller", not "the screen", until it has one.
  //
  // Two verbs, not three. There is no reset, because a reset IS a save: the GET hands back the
  // compiled-in text for any prompt nobody has edited, so restoring one is saving what the GET just
  // returned — and doing it that way leaves the restoration in the revision history, where a
  // third endpoint that deleted rows would have left a gap.
  //
  // Validated on the WRITE, like everything else behind this credential, and here that is the only
  // gate there is: nothing downstream reviews a prompt, and the model reads whatever this accepts.
  if (req.method === "GET" && pathname === "/admin/api/prompts") {
    return json({ prompts: await livePrompts(deps) });
  }

  if (req.method === "PUT" && pathname === "/admin/api/prompts") {
    const body = await req.json() as { key?: unknown; text?: unknown };
    const result = await savePrompt(deps, body?.key, body?.text);
    if (result.ok) return json({ key: result.key, version: result.version });
    // 409, not 422, when another save won the race: the prose was fine and a retry succeeds. 422
    // means the text itself was refused, and the editor tells the two apart.
    return json({ errors: result.errors }, result.conflict ? 409 : 422);
  }

  // The revisions of one prompt. The append-only table's whole point, and the only way to answer
  // "what were we sending on the 3rd" without a psql session.
  const revisions = /^\/admin\/api\/prompts\/([a-z_]+)\/revisions$/.exec(pathname);
  if (req.method === "GET" && revisions) {
    const history = await promptHistory(deps, revisions[1]);
    return history ? json({ key: revisions[1], revisions: history }) : notFound();
  }

  // ── The switches (#563) ────────────────────────────────────────────────────────────────────
  //
  // `set_by` is the admin this request resolved to, never a field of the body.
  if (req.method === "GET" && pathname === "/admin/api/switches") {
    return json(await adminSwitches(deps));
  }
  const sw = /^\/admin\/api\/switches\/([a-z._-]+)$/.exec(pathname);
  if (req.method === "PUT" && sw) {
    const body = await req.json().catch(() => null) as { enabled?: unknown } | null;
    const result = await saveSwitch(deps, sw[1], body?.enabled, adminId);
    return result.ok ? json(await adminSwitches(deps)) : json({ errors: result.errors }, 422);
  }

  // ── Experiments (ieat-app#2669) ─────────────────────────────────────────────────────────
  //
  // One experiment is a language, its targeting rules and its arms. create gives the draft its
  // control — a clone of the copy that serves now — and the editor edits arms and rules while the
  // row is a draft; a running experiment is frozen by the store's own guard, so every write here
  // that answers false is a write against a running experiment, shown as the refusal it is.
  if (req.method === "GET" && pathname === "/admin/api/experiments") {
    const ask = rangeParam(url, null);
    // A `days` ask resolves to instants here, like on the bounded endpoints — the echo carries the
    // spelling the request used AND the bounds it filtered by.
    const resolved = "days" in ask ? adminRangeOf(ask.days, 30) : ask;
    // `order` is what the arm order editor starts from and may remove (ieat-app#2788); the rules
    // themselves stay on the server, which refuses a bad order by row on the save.
    return json({
      experiments: await onboardingExperiments(deps, resolved), range: adminWindowEcho(resolved),
      order: { span: DEFAULT_ORDER, removable: REMOVABLE_PLACES },
    });
  }
  if (req.method === "POST" && pathname === "/admin/api/experiments") {
    const body = await req.json().catch(() => null) as { lang?: unknown } | null;
    if (body === null) return json({ errors: ["body must be JSON"] }, 422);
    // The draft is FOR a language — an unknown code silently making an English one is a
    // targeting mistake nobody asked for.
    if (typeof body.lang !== "string" || !(LANGS as readonly string[]).includes(body.lang)) {
      return json({ errors: ["lang must be a language the app knows"] }, 422);
    }
    return json({ experiment: await createOnboardingExperiment(deps, adminId, body.lang as Lang) });
  }
  const expMatch = /^\/admin\/api\/experiments\/([^/]+)(?:\/(variants)(?:\/(\d+))?|\/(start|stop))?$/.exec(pathname);
  if (expMatch !== null) {
    const id = expMatch[1]!;
    const sub = expMatch[2] ?? expMatch[4];
    if (req.method === "PUT" && sub === undefined) {
      const body = await req.json().catch(() => ({})) as { rules?: unknown; weights?: unknown };
      const result = await setOnboardingExperiment(deps, id, { rules: body.rules, weights: body.weights });
      return result.ok ? json({ ok: true }) : json({ errors: result.errors }, 422);
    }
    if (req.method === "PUT" && sub === "variants") {
      const raw: unknown = await req.json().catch(() => ({}));
      const body = (raw !== null && typeof raw === "object" ? raw : {}) as { content?: unknown; order?: unknown };
      const index = Number(expMatch[3]);
      // Two editors, two bodies, never both (ieat-app#2788): `{order}` is the order editor's save
      // (`null` clears it), anything else the copy editor's. A body carrying both is refused rather
      // than half-written — a content save is committed before an order could be refused.
      if ("order" in body) {
        if (body.content !== undefined) return json({ errors: ["send the copy or the order, not both"] }, 422);
        const result = await saveOnboardingVariantOrder(deps, id, index, body.order);
        return result.ok ? json({ ok: true }) : json({ errors: result.errors, refusals: result.refusals ?? [] }, 422);
      }
      const result = await saveOnboardingVariant(deps, id, index, body.content);
      return result.ok ? json({ version: result.version }) : json({ errors: result.errors }, 422);
    }
    if (req.method === "POST" && sub === "variants") {
      const result = await addOnboardingVariant(deps, id);
      return result.ok ? json({ index: result.index }) : json({ errors: result.errors }, 422);
    }
    if (req.method === "POST" && sub === "start") {
      const result = await startOnboardingExperiment(deps, id);
      return result.ok ? json({ ok: true }) : json({ errors: result.errors }, 422);
    }
    if (req.method === "POST" && sub === "stop") {
      const result = await stopOnboardingExperiment(deps, id);
      return result.ok ? json({ ok: true }) : json({ errors: result.errors }, 422);
    }
    return notFound();
  }

  if (req.method === "GET" && pathname === "/admin/api/funnel") {
    const ask = rangeParam(url, { defaultDays: 30, maxDays: 365 });
    return json(await onboardingFunnel(deps, "days" in ask ? ask.days : ask));
  }

  // ── The accounts ───────────────────────────────────────────────────────────────────────────
  //
  // #374, and it is THE WIDEST READ IN THE PRODUCT: every account, with the address on it. What
  // stands between it and any signed-in phone is the role checked above, and nothing else — which
  // is why the store method it calls is named for what it does rather than being a relaxed `WHERE`
  // on something the app already calls.
  //
  // READ-ONLY. A list is a read; deleting an account or granting an entitlement is a separate
  // decision with a separate blast radius, and neither has been made. There is no method here but
  // GET, so the four others fall through to the 404 at the bottom of this function.
  if (req.method === "GET" && pathname === "/admin/api/users") {
    const raw = Number(url.searchParams.get("limit") ?? 50);
    // Clamped rather than rejected, the same way the funnel's `days` is: this is a dashboard
    // control, and a silly number in a query string should show a sensible page.
    const limit = Number.isFinite(raw) ? Math.min(200, Math.max(1, Math.round(raw))) : 50;
    const q = url.searchParams.get("q") ?? "";
    const cursor = url.searchParams.get("cursor") ?? "";
    const ask = rangeParam(url, null);
    return json(await adminUsers(deps, {
      limit,
      ...(q === "" ? {} : { q }),
      ...(cursor === "" ? {} : { cursor }),
      ...("days" in ask ? adminRangeOf(ask.days, 30) : ask),
    }));
  }

  // ── One account's summary (#571) — the Accounts detail pane. READ-ONLY. ───────────────────
  const summary = pathname.match(/^\/admin\/api\/users\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/);
  if (summary && req.method === "GET") {
    const view = await adminUserSummary(deps, summary[1]!);
    return view ? json(view) : notFound();
  }

  // ── Staff flag and the push composer (eait#531) ───────────────────────────────────────────
  // Push: the account's own daily bound (ieat-app#1965). Null clears it back to the instance default.
  const pushCap = pathname.match(/^\/admin\/api\/users\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/push-cap$/);
  if (pushCap && req.method === "PUT") {
    const body = await req.json().catch(() => null) as { pushDailyMax?: unknown } | null;
    const n = body?.pushDailyMax;
    if (n !== null && !(Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 2_147_483_647)) {
      return json({ errors: ["pushDailyMax must be a whole number of sends a day, or null for no limit"] }, 422);
    }
    return await deps.store.setPushDailyMax(pushCap[1]!, n as number | null) ? json({ pushDailyMax: n }) : notFound();
  }

  const staffRoute = pathname.match(/^\/admin\/api\/users\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/staff$/);
  if (staffRoute && req.method === "PUT") {
    const body = await req.json().catch(() => null) as { staff?: unknown } | null;
    if (typeof body?.staff !== "boolean") return json({ errors: ["staff: true or false"] }, 422);
    return await deps.store.setStaff(staffRoute[1]!, body.staff) ? json({ staff: body.staff }) : notFound();
  }
  if (req.method === "POST" && pathname === "/admin/api/push/send") {
    const out = await sendAdminPush(deps, adminId, await req.json().catch(() => null));
    return json(out, out.ok ? 200 : 422);
  }

  // ── ONE ACCOUNT'S THREAD ───────────────────────────────────────────────────────────────────
  //
  // #376. The coach answers in the app's chat thread, and when a reply is wrong, embarrassing
  // or just strange there was no way to read the turn back — which meant `docker compose logs` and
  // hope.
  //
  // THE MOST SENSITIVE SURFACE IN THE PRODUCT. The onboarding chat collects medical free text, and
  // `deploy/Caddyfile` deliberately does not log request bodies for that reason. So this response
  // is `no-store`: an intermediary that kept a copy would be a copy of that text nobody knows about
  // and nobody can erase.
  //
  // READ-ONLY, and that is the interesting half: there is no method here but GET, so the admin
  // cannot send a message as the coach. A phone cannot put a sentence in Spud's mouth
  // (`POST /v1/messages/lines` takes scripted ids only) and neither can this.
  const chat = pathname.match(/^\/admin\/api\/users\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/chat$/);
  if (chat && req.method === "GET") {
    const before = Number(url.searchParams.get("before"));
    const limit = Number(url.searchParams.get("limit"));
    const view = await adminUserChat(deps, chat[1]!, {
      ...(Number.isSafeInteger(before) && before > 0 ? { before } : {}),
      ...(Number.isSafeInteger(limit) && limit > 0 ? { limit } : {}),
    });
    if (!view) return notFound();
    return new Response(JSON.stringify(view), {
      headers: { "content-type": "application/json", "cache-control": "no-store, private" },
    });
  }

  // ── ONE ACCOUNT'S DIARY, AND THE PHOTOGRAPHS BEHIND IT ─────────────────────────────────────
  //
  // #375. "The analysis was wrong" is answerable now: the meal row, what the model said, the
  // verdicts the person saw, and the picture they took.
  //
  // THE ACCOUNT COMES OUT OF THE PATH AND THE ROWS COME OUT OF A SCOPED READ. `mealsSince` and
  // `getPhoto` are the same methods the app's own routes call, with the same `userId` argument;
  // what the role buys is the right to NAME an account, never a widened query. So an admin cannot
  // pair one account's id with another's meal — both go to the scoped read and a mismatch is a 404.
  //
  // The uuid is matched before it reaches Postgres, like the cap route below: a typo is otherwise a
  // cast error and a 500.
  const diary = pathname.match(/^\/admin\/api\/users\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/meals$/);
  if (diary && req.method === "GET") {
    const view = await adminUserDiary(deps, diary[1]!, {
      ...(isDate(url.searchParams.get("from")) ? { from: url.searchParams.get("from")! } : {}),
      ...(isDate(url.searchParams.get("to")) ? { to: url.searchParams.get("to")! } : {}),
    });
    return view ? json(view) : notFound();
  }

  // One stored photograph, by position — the same shape the app's own `/v1/meals/:id/photos/:n`
  // has, on the admin's credential and for an account the admin named.
  //
  // THE BYTES, NOT A LINK TO THEM. A signed URL would be a second credential for the most sensitive
  // thing this product holds, and it would travel in a query string — which is where a bearer is
  // refused for landing in history, in a `Referer` and in every log between here and the browser
  // (#372 measured exactly that). The panel fetches these with the bearer it already holds and
  // renders a `blob:` URL, so nothing addressable ever exists.
  const photo = pathname.match(
    /^\/admin\/api\/users\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/meals\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/photos\/(\d{1,2})$/);
  if (photo && req.method === "GET") {
    const stored = await deps.store.getPhoto(photo[1]!, photo[2]!, Number(photo[3]));
    if (!stored) return notFound();
    return new Response(new Uint8Array(stored.bytes), {
      headers: {
        "content-type": stored.mime,
        // NEVER STORED BY ANYTHING IN BETWEEN. A cached photograph of somebody's meal is a copy
        // nobody knows about and nobody can erase.
        "cache-control": "no-store, private",
        "content-security-policy": "default-src 'none'; sandbox",
        "x-content-type-options": "nosniff",
      },
    });
  }

  // ── THE NUMBERS PAST THE FUNNEL (#377) ─────────────────────────────────────────────────────
  //
  // The funnel says how far into onboarding people get. These say what is being spent and whether
  // anybody came back — the two an operator acts on. An aggregate is still a query over other
  // people's rows, so it is behind the same role as everything else here.
  if (req.method === "GET" && pathname === "/admin/api/metrics") {
    // `days` stays a count for this one — "30 days" is 30 calendar rows, not 30×24h.
    const ask = rangeParam(url, { defaultDays: 30, maxDays: 400 });
    return json(await adminMetrics(deps, "days" in ask ? ask : { ...ask }));
  }

  // ── Per-account grant (ieat-app#2364: no default sample) ─────────────────────────────────────────────────────────────────────
  //
  // The analyses the admin grants one account before a subscription; null takes the grant away. The
  // id must look like one before it reaches Postgres, or a typo is a cast error and a 500.
  const cap = pathname.match(/^\/admin\/api\/users\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/cap$/);
  if (cap) {
    const userId = cap[1]!;
    if (req.method === "GET") {
      const view = await userCap(deps, userId);
      return view ? json(view) : notFound();
    }
    if (req.method === "PUT") {
      const body = await req.json().catch(() => null) as { freeAnalyses?: unknown } | null;
      const n = body?.freeAnalyses;
      // Bounded by the column: `free_analyses integer`, and a number past it is a cast error.
      if (n !== null && !(Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 2_147_483_647)) {
        return json({ errors: ["freeAnalyses must be a whole number of analyses, or null for none"] }, 422);
      }
      const view = await setUserCap(deps, userId, n as number | null);
      return view ? json(view) : notFound();
    }
  }

  // ── Referrals (#899) ───────────────────────────────────────────────────────────────────────
  //
  // Shared, opened, joined and paid per day, by channel and by refusal. Counts only, like the
  // opens view below: no account, no code, nothing that names a person.
  if (req.method === "GET" && pathname === "/admin/api/referrals") {
    const ask = rangeParam(url, { defaultDays: 7, maxDays: 90 });
    return json(await referralAdminView(deps, "days" in ask ? ask.days : ask));
  }

  // ── Push: the opens view (#1759) ───────────────────────────────────────────────────────────
  //
  // Per day and per kind/template: sent, accepted, dead, opened, converted. Counts only — no
  // account, token or body — so it is the one push read that names nobody.
  if (req.method === "GET" && pathname === "/admin/api/push/stats") {
    const ask = rangeParam(url, { defaultDays: 7, maxDays: PUSH_STATS_MAX_DAYS });
    return json(await pushOpenView(deps, "days" in ask ? ask.days : ask));
  }

  // ── Push: test one account, read what it was sent ──────────────────────────────────────────
  //
  // The test claims like every sender, so a second one the same local day is a 409 (`slot-taken`),
  // and an account at its bound is a 409 `account-cap`. The log never carries a token: it names the device by
  // nothing, and what it records is the state each message reached.
  const push = pathname.match(/^\/admin\/api\/users\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/push-(test|log)$/);
  if (push) {
    const userId = push[1]!;
    if (req.method === "POST" && push[2] === "test") {
      const body = await req.json().catch(() => null) as { imageUrl?: unknown; route?: unknown } | null;
      const out = await sendTestPush(deps, userId, Date.now(), body?.imageUrl, body?.route);
      return json(out, out.ok ? 200 : !out.ok && (out.reason === "image-not-allowed" || out.reason === "route-not-allowed") ? 400 : 409);
    }
    if (req.method === "GET" && push[2] === "log") {
      const rows = await deps.store.sendLogFor(userId, 20);
      return json({ sends: rows.map(({ token: _token, ...row }) => row) });
    }
  }

  return notFound();
}
