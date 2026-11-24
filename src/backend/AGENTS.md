# AGENTS.md — backend

> `#NNN` and `ieat-app#NNN` references point to a private tracker. The rules they support hold here regardless.

The server. Root `AGENTS.md` covers the repo; this covers this workspace.

## The shape, in one pass

```
api/routes.ts     one handler per route; it calls ONE engine function and returns
engine/           all product logic — day/week, meals, chat, identity, entitlement, onboarding
store.ts          the port; store.pg.ts is what runs, store.memory.ts is what tests run against
llm/              port.ts + prompt.ts + openrouter.ts + demo.ts + local-agent.ts. Prompts are
                  AUTHORED in prompt.ts and may be OVERRIDDEN by a row in llm_prompts; prompt.ts is
                  the seed and the fallback. `coach` is the agent loop; its tools are closures the
                  ENGINE builds (engine/coach.ts). `local-agent.ts` is the SECOND provider —
                  `EAIT__BACKEND__LLM_PROVIDER=claude-cli|codex-cli` runs a coding-agent CLI on the
                  host behind the same port; dev and self-hosted only, and adding a CLI is one
                  entry in its `ADAPTERS`. `openai-compatible` is the THIRD: openrouter.ts in its
                  `openai` dialect, against any plain OpenAI chat-completions server (Ollama, vLLM,
                  LM Studio, llama.cpp, Together, Groq) — see "A self-hosted model server" below.
auth/             token issue/verify. Tokens are stored as sha256, never in the clear
config.ts         configDefaults() is the single source of defaults; loadConfig() layers env over it
push/             outbound. dev/seed.ts is fixtures, written against the Store INTERFACE
telegram/         the Telegram connector, a second transport over the engine — telegram/AGENTS.md
```

**If a route needs logic the engine does not expose, the logic goes in the engine** — not into the
route. A route that computes is a rule the tests cannot reach.

## Invariants a reviewer should check first

- **Per-user scoping on every read and write.** `userId` arrives as an ARGUMENT resolved from
  credentials — never from a request body, a model output, or a tool call. Never widen a meal query
  beyond `id = ? AND user_id = ?`. The one exception is the RevenueCat webhook, where the id IS the
  message, and it is safe only because of the shared secret checked before the body is read.
- **Row-level security is the second lock, and it is ARMED BY DEFAULT.** Every table whose rows
  belong to one account has RLS `enable`d AND `force`d, with one policy: a statement sees a row only
  when it has declared whose row it is, in `app.user_id`, for the length of its transaction. A
  transaction that declares nothing matches nothing — `app_user_id()` is null, `column = null` is
  null, and a policy that is not true refuses. So a read that forgets its own `user_id = ?` returns
  NOTHING rather than returning everybody, which is the whole point of it. Measured, through the
  live API, by deleting the predicate from `chatBefore`: with the policy on, one account's lines and
  no others; with it off, 48 lines belonging to three accounts.
  `RLS_TABLES` in `store.pg.ts` is the list, and the DDL is generated from it. `users` is keyed on
  `id`, because the row IS the account. A table that belongs to nobody stays out of it
  (`onboarding_content`, `notification_copy`).
- **What declares it is the store's own wrapper, and `SCOPE` says what every method may touch.**
  `postgresStore` wraps each method in a transaction that sets `app.user_id` from the argument
  holding it — so no statement in that file had to be rewritten, and one
  added tomorrow is covered without being touched. `sql` there is the CURRENT connection, an
  `AsyncLocalStorage`-backed proxy over the pool; the setting is always `set_config(…, true)`,
  because `Bun.sql` hands a connection to the next caller the moment a transaction commits and a
  session-level one would make them that user. A method that belongs to no account says
  `"unscoped"` in `SCOPE` — resolving a user from a credential, `mergeUsers` and `moveIdentity`
  (two accounts), `putPushToken` (one installation, deliberately moved between accounts), the admin
  surface, the sweeps. That escape is explicit, enumerated and argued for one entry at a time, and
  a test pins the whole list so adding one is a visible edit rather than the easy way past a
  failure. The same goes for the two places a scoped method holds a global statement: `unscoped()`
  turns it on for that statement and restores it in a `finally`.
- **`force` is not decoration, and a superuser escapes it anyway.** The backend creates its own
  tables and therefore OWNS them, and an owner is exempt from its own policies without `force`. A
  SUPERUSER is exempt even with it, which is why `src/scripts/db.sh` gives the development database
  to a plain `eait_app` role rather than the image's `eait`. The deployed role is configured outside
  this repository, so `postgresStore` asks Postgres at boot and logs `row-level security is INERT`
  when the connection bypasses — said rather than refused, because an inert lock is no reason to
  take the product down on a deploy. `src/iac/db-init.sh` is what makes a DEPLOYED database
  that role's, and `db-init.contract.test.ts` is what keeps the two in step: it builds a database
  the superuser created, runs that script over it, and fails if anything in `public` is still
  somebody else's. Add an object class to `SCHEMA` and hand it over there in the same commit — the
  migration alters all of it on every boot, so what is not handed over is a host that stops booting
  at its next restart rather than a tidiness problem.
- **Migrations run unscoped, on a connection that is then closed.** The DDL does not care, but the
  BACKFILLS do: an `update` that repairs old rows would, on every database from its second boot
  onwards, match nothing and report success. Its own connection, ended in a `finally`, so the escape
  cannot outlive the migration even if it throws.
- **None of this replaces `user_id = ?`.** Every predicate stays. A policy is what catches the one
  that is missing, and two locks are the point. A new user-scoped table adds its line to
  `RLS_TABLES` beside its `create table`; a new store method adds its line to `SCOPE`, and the
  construction of the store throws if it does not. THE CHECKS ARE AUTOMATED, in
  `store.contract.test.ts` → "row-level security": one reads `pg_class.relrowsecurity` /
  `relforcerowsecurity` and `pg_policies` for every table the CATALOG says carries a `user_id` and
  fails naming the one without a policy; another proves a connection declaring nobody reads and
  writes nothing; another fails when a method is missing from `SCOPE` or lingers in it after being
  renamed.

- **Both store implementations must agree.** `store.contract.test.ts` runs the same suite against
  each. A rule proven only against the memory store is a rule about a mock's mood. Its Postgres
  half runs under `./dev test`, against this worktree's own DERIVED test database — never a
  hand-created `eait_test`, which several worktrees would share while all of them migrate and
  write it, and never the dev database, which `./dev seed` puts an admin into.
- **Empty means absent, not zero.** `totalsSince` groups by date, so a day with no meals produces
  NO ROW. Anything reading it is reading "days that have something", and treating a missing row as
  a zero is a claim the query never made.
- **A cap is charged before the model call, not after.** A cap counting only successes is one a
  retry loop walks through. Except a `GatewayRefusal` — a status that provably generated nothing
  (401, 402, 429, 503) was billed nothing, and `store.undoAnalysis` gives the analysis back. Charge
  on ambiguity: a timeout or a truncation may have run — and so does a gateway status on any call
  but the FIRST of a turn (the schema retry, `routeText`'s focused second call), because those
  follow a completion that was billed.
- **The charge is the cost ledger.** Every `analyses` row stays, with its cost, on the paid daily
  cap; only a gateway refusal that generated nothing is given back (`refundGatewayRefusal`). What
  bounds a retry loop is `api/ratelimit.ts`.
- **A billed turn runs once per client id** (#708). `logPhotoMeal` and `handleText` claim
  `(user, clientId)` in `turns` before the caps (`engine/turns.ts`, `once`). A request re-sending the
  id gets what the first attempt settled, refusals included, or waits for it; it never calls a model,
  charges or logs. A first attempt that threw, or never settled within its budget, is
  `OUTCOME_UNKNOWN` to its replay. A new billed route takes a `clientId` and goes through `once`, or
  the clients' outboxes become the way to log a meal twice. The meal is dated by `capturedAt`; the
  caps and the charge are the day the turn arrives.
- **Errors are logged, never returned.** An error string from deep in the stack can carry the
  prompt, and the prompt carries the user's medical free text. Config goes through `redact()`.
- **Never log the API key, the database URL with credentials, or raw image bytes.**
- **The app never creates the database.** See the root `AGENTS.md` § The store port.
- **A migration is EXPAND now and CONTRACT a release later** (ieat-app#3108). A deploy replaces one
  replica at a time, so the new build runs `migrate()` at boot while the PREVIOUS build still
  serves on the other replica against the same database. Every statement must be one that previous
  build survives: add a column nullable or with a default, add a table, widen a check. Dropping or
  renaming what it reads, retyping it, `set not null` on a column it may leave null, or a `not null`
  column with no default it does not write, ships only after a release that no longer needs it; and
  long `ACCESS EXCLUSIVE` DDL on a hot table stalls the serving replica for its whole duration.
  `migrate-expand.test.ts` lists every drop, rename, retype, `set not null` and default-less
  `not null` column `store.pg.ts` carries and fails on a new one; adding it there is the deliberate step, with the release that
  stopped reading it named in the PR. Falsified the day a deploy stops all replicas before booting
  the new build.
- **State conditions live in the store's own guarded statements**, never in a read the engine did
  first. Deliveries can be concurrent and nothing is transactional, so a decision made from a stale
  read is dropped permanently. **`onboarding_content` and `notification_copy` apply this rule to a
  document.** The per-language write is `jsonb_set` on the locked row, so two admins saving two
  languages cannot carry each other away. The revision number comes off the `version` COLUMN in the
  same statement, not off a count the engine took first. `version` is load-bearing. These two
  document writes bind the object, not `JSON.stringify` of it. The driver already encodes a bound
  value, so `${JSON.stringify(doc)}::jsonb` is a no-op cast that stores a jsonb STRING, and
  `jsonb_set` on a string is an error. Not every jsonb write follows this: `setMealReminders`
  still binds `${JSON.stringify(settings)}::jsonb`.
- **The admin is a ROLE an account carries** (`users.role`, checked `=== "admin"` AFTER the user is
  resolved). There is no admin token: a replayable secret in a header and a role would be two ways
  in, and the role is the only one. Nobody holding the role means the surface does not exist, and
  every path under it answers 404, not 403. An identified ordinary account gets 404 as well. Only an
  anonymous request gets 401, because the public page already proves the route exists. **The role is
  granted OUT OF BAND and only out of band**: `EAIT__BACKEND__ADMIN_BOOTSTRAP_USER_ID`, a user id and
  never a provider subject, applied at boot. It is not on `Profile`, so no `PATCH` can write it in
  either store. It is not in the column list `mergeUsers` copies, so no merge can carry it. Deleting
  the last admin switches the surface off, which the variable never could.

## A self-hosted model server

`EAIT__BACKEND__LLM_PROVIDER=openai-compatible` runs the same transport, `openRouterPorts`, with
`dialect: "openai"`. **That dialect sends nothing only OpenRouter understands**: no `reasoning` (the
coach's fixed `low` included), no `provider` pin, no `models` fallback, no `x-title`, and no
`authorization` when the key is empty — a strict server refuses a body carrying a field it does not
know, and a local one wants no key. Everything else is the same request: `json_schema`, tools,
streaming, `max_tokens`, `temperature`. A new OpenRouter-only field goes behind the same `openRouter`
flag in that file, or this provider breaks on the next request.

- **It names its own server and its own models, or it does not boot.** `LLM_BASE_URL`, `LLM_MODEL` and
  `LLM_CHAT_MODEL` are required for it, because every default is OpenRouter's: an unset base URL
  would send the photos to a gateway the operator chose not to use, and an unset model names one no
  self-hosted server has. `LLM_REASONING_EFFORT`, `LLM_PROVIDER_ORDER`, `LLM_PROVIDER_SORT` and
  `LLM_FALLBACK_MODELS` are ignored. In the prod container `docker-compose.prod.yml` fills those
  with OpenRouter's values when they are missing, so there the env file, not the boot check, is
  what sets them.
- **What the server must do**: `LLM_MODEL` reads images, and `response_format` `json_schema` is
  honoured — otherwise every photo fails the schema twice and is `analysis-failed`.
- **Cost is computed, not reported.** Such a server returns token counts and no `usage.cost`, so its
  calls are unpriced (null: the cost report counts them as unpriced, never as zero) unless
  `LLM_INPUT_PRICE_PER_MTOK` and `LLM_OUTPUT_PRICE_PER_MTOK` are both set; then cost is
  `(prompt × input + completion × output) / 1e6`, and 0 is a real price. A streamed request asks
  for the usage chunk (`stream_options.include_usage`), which a plain server sends only on request.
  One price pair covers both models. OpenRouter ignores both settings.
- **It is a different processor.** Production runs OpenRouter, and the privacy page names it and its
  providers. Pointing production at another server changes who sees the photos, so the privacy page
  changes FIRST (ieat-app#1908 before #1914 for the Alibaba fallback).

Verified against a real Ollama (0.9.0, CPU, `qwen2.5vl:3b` + `qwen2.5:3b`, 2026-10-10): a photo
streamed and parsed in 164 s, the coach answered in 123 s. Proof that the wiring works, not of
accuracy, which is a per-model question.

## Windows and bounds

Four diary routes carry four different bounds. When you read or write a comment about one, say
which one it constrains: a bound described as covering more than it does is how a client comes to
refuse something the server would have answered.

- `/v1/diary/week` is bounded by `MAX_WINDOW_DAYS`, `engine/diary.ts`'s alias of the contract's
  `DIARY_WINDOW_DAYS`, which the contract exports so the app can be TOLD it.
- `/v1/diary/days` is bounded by `DIARY_RANGE_MAX_DAYS` (31 calendar days) in the contract.
- `/v1/diary/day` is **not** bounded. It validates the shape of a date and nothing else.
- `/v1/diary/average` takes `week=0..3` (`AVERAGE_WEEKS_BACK`), not a date window.

The `MAX_WINDOW_DAYS` inside `src/shared/dates.ts` is a different, unexported constant. Check
which one a comment names.

## Testing

`bun test ./src/backend` — no database needed, because the memory store is a real implementation of
the port rather than a mock. `EAIT__BACKEND__DATABASE_URL` is only for a real backend (`./dev up --backend`).

The Postgres half runs when `TEST_DATABASE_URL` is set and says loudly when it is not. Point it at a
database of THIS worktree's own — `./dev env show` names the one the backend uses; the test suite
wants a second one beside it, never slot 0's `eait`. The URL must name the `eait_app` role and not
`eait`: the row-level-security cases assert that first, because a superuser reads every row whatever
a policy says.

The demo analyzer (`llm/demo.ts`) must stay as poor as the real one: see the root `AGENTS.md`
§ Hard conventions (do not break).

## Adding to this workspace

The steps for a new endpoint, new product logic and a new LLM capability are in
the root `AGENTS.md` § Where to add things.

A SEVENTH SYSTEM PROMPT IS FOUR EDITS, and the tests name the one you forget: the constant and its
entry in `PROMPT_DEFAULTS`, its key in `PROMPT_KEYS`, the same key in the `llm_prompts_key_check`
constraint in `store.pg.ts`, and the call site in `openrouter.ts` reading it off `await prompts()`
rather than importing the constant. Nothing has to be seeded — every store writes the shipped text
for a key it does not have, so the new prompt appears in `/admin/api/prompts` on the next boot. Miss the constraint and `prompt.schema.test.ts` fails naming
the key with no database; miss it and run the store contract suite against Postgres and that fails
naming it too.

## Auth, the paid tier, and the surfaces the server owns

- **Onboarding also happens in a browser, at `/start`.** `src/backend/web/`, served by the backend,
  server-rendered, no JavaScript and no build step — so the page and the form handler are the same
  origin and there is no CORS to add to an API that deliberately has none. Sign in with Apple or
  Google, answer the same questions `shared` defines, read the plan, and subscribe through a
  checkout link that carries the user id. **It offers the SAME PAIR the app does, and that is the
  point rather than symmetry**: the app shows two buttons, and pressing the other one lands in a
  different account — it attaches to the anonymous one the install already has, so onboarding runs
  again and the web-made plan, plus anything bought from it, stays on an account
  `engine/identity.ts` will never merge. The plan page names the button they used. **`webProviders`
  in `auth/web-oauth.ts` decides what exists**: no provider configured and every path answers 404,
  the shape `/admin` and the purchase webhook use; one configured is a supported host and the
  other's routes 404. Apple's client secret is not a stored string — it is a five-minute ES256 JWT
  minted per exchange from the `.p8`, and the Service ID (not the bundle id) is what its token
  carries as `aud`.

- **Photos live with the meal.** A logged meal's photos are stored in `meal_photos` (bytea, cascade
  from `meals` and `users`), written by `logPhotoMeal` AFTER the caps are charged and the meal is
  inserted, and never for a refused or failed turn. Every read is `meal_id = ? AND user_id = ?`
  (`GET /v1/meals/:id/photos/:n`); they move with a merge and go with the meal or the account.
  Never on the server's disk, never logged, never in a result. The phone still deletes every
  capture in a `finally`; fetched photos sit in expo-image's disk cache, cleared with the session.
  The one cross-user photo read is a host-side export script in the deploying repo. It is not an API route.
- **A session token is stored as a hash, and expires when it stops being used.**
  `src/backend/auth/tokens.ts`. The `tokens` table holds `sha256(token)` and there is no column
  holding the token — a dump names accounts and login times without letting the reader become any of
  them, which matters because a dump runs nightly by cron and is rsynced off the box on purpose.
  Expiry is IDLE time, not age: 180 days without a request, slid forward on use. An absolute one
  signs out the people who use the app most, on a schedule, for no benefit.
- **The paid tier is SERVER state, and the RevenueCat webhook is its only source.**
  - The App Store takes the payment and RevenueCat posts to `/v1/revenuecat/webhook`. The route is
    off entirely unless `EAIT__BACKEND__REVENUECAT_WEBHOOK_TOKEN` is set. It answers 404 then, like
    `/admin`, because "there is a purchase webhook here" is information.
  - No client route grants an entitlement, and there must never be one. The phone's own
    `CustomerInfo` from the SDK is a rendering hint. It disagrees with the server for a few seconds
    after every purchase, and only the server refuses requests. The app is TOLD, in
    `ProfileResponse.entitlement` and `limits.dailyPhotoCap`.
  - **The cap is decided in `dailyPhotoCap` (`engine/entitlement.ts`) and nowhere else.**
    `checkCaps` refuses with it and `limitsOf` reports it. Two copies of that number would be the
    app promising an allowance the server will not honour. An entitled account gets
    `paidDailyPhotoCap` per day.
  - **There is no free tier and no sample** (ieat-app#2364: the 3-day trial is the only way in).
    `checkCaps` answers every analysis of an unentitled account with `subscription-required`
    (402), before any charge, until the webhook has written an entitlement. That covers photo,
    library and typed analyses, so a sentence is not the free way around the ask.
  - Three exceptions only:
    - A SELF-HOSTED instance that sets `EAIT__BACKEND__PAYWALL=off` (`config.paywall`). Production
      never sets it, and the deploying repo's tests refuse it.
    - An analysis count the ADMIN granted one account (`getFreeAnalyses`, none by default). A
      development store grants every account it creates through that same path (`dev/grant.ts`,
      `--grant N`), which is how a demo, the e2e runners and the tests log meals.
    - ONE analysis for an account holding T1's `own-meal` arm in a running experiment
      (ieat-app#3165). It is the larger of that one and any grant, read off the stored assignment and
      enforced by the guarded charge as the lifetime limit's `floor`. It ends with the experiment or
      the `onboarding.experiments` switch.
  - `limits.subscriptionRequired` (`unpaidRefused`, the grant included) tells the app, and the app
    opens the paywall on it. The refusal is the authority and the sheet only renders it.
  - **The paywall sheet is the app's own, and its words are `PAY_COPY`**
    (`src/shared/app/pay-copy.ts`). They ship with a build, in every shipped language, and
    `pay-copy.test.ts` puts them through the claims gate. RevenueCat supplies offerings and purchase
    calls only. No RevenueCat paywall is built or presented. The app never branches on the SDK's own
    `CustomerInfo`.
  - A purchase ends with the app polling OUR profile until the webhook has landed, because for those
    seconds the phone says subscribed and the server still answers 402. **Then the app carries out
    the action the sheet interrupted**: the photo, the typed meal, the correction, the question. A
    gate the user resolves never costs them their input and never asks for a second attempt (#662).
  - **A lifetime unlock and a subscription are SEPARATE grants on one record**, because a customer
    can hold both. `expiresAt` is the subscription, `lifetimeProductId` is the unlock, and
    `entitlementLive` says entitled if either does. One field carrying both would let a lifetime
    refund revoke a monthly plan that is still paid for.
  - Each delivery touches exactly one grant. An expiry sets the subscription. `NON_RENEWING_PURCHASE`
    grants the unlock. `CANCELLATION` or `EXPIRATION` with no expiry clears the unlock only when the
    stored unlock came from the same product.
  - **Every state condition lives in the store's own guarded statements.** See § Invariants a
    reviewer should check first. The webhook answers 200 either way, so a decision made from a
    stale read is dropped permanently.
  - **Webhook delivery is not ordered.** `putEntitlement` applies an event only when it is newer
    than the last one applied TO THAT GRANT, the same rule `weight_measured_at` enforces. Without it,
    a cancellation generated before a renewal arrives after it and revokes a subscription somebody
    is paying for.
  - The id in the payload is the ONE user id in this codebase that comes from a request body, as
    the per-user scoping invariant above says. `putEntitlement` never creates a user.
- **A cap on an account is not a cap while accounts are free.** `POST /v1/auth/device` mints one for
  anybody with a 32-character string, so anything an account were given for
  free would cost an attacker one HTTP call to reset — and the minting is itself the attack: it spends the
  instance's money one fresh account at a time.
  `src/backend/api/ratelimit.ts` bounds the billed routes PER ADDRESS as well. The address is the
  **last** `X-Forwarded-For` value, never the first: a proxy appends what it saw, so everything left
  of it was written by the client. IPv6 keys on the /64. In memory — a restart forgives everyone,
  and so does the failover that moves the counting to the replica Caddy's `lb_policy first` had not
  been using; the day traffic splits across both replicas, the counting moves into the store.
- **A backup is scheduled and proven by the deploy, not by a comment.** An upload nobody has
  restored is not a backup, and a dump carries medical free text, so it is encrypted before it
  leaves the host.
- **The dump connects as the SUPERUSER `eait`, never as `eait_app`.** The backend owns its tables
  and the policies are `force`d, so the owner is subject to them too — and `pg_dump` sets
  `row_security = off`, which Postgres refuses outright from a role that cannot bypass:
  `ERROR: query would be affected by row-level security policy for table "meals"`. The repair that
  suggests itself, `--enable-row-security`, is the dangerous one: the dump session declares no
  `app.user_id`, so it EXITS 0 AND WRITES A FILE WITH NO ROWS IN IT — measured, 0 of 168 — and the
  deploy's restore check asserts only that the file is a dump, not that anything is in it. That is
  the silent-data-loss shape this repository already has scar tissue for. `store.contract.test.ts`
  pins both halves ("refuses a dump taken as the application role"), so the day somebody points the
  backup at the application role, a test says which failure they bought.
- **One health metric has an effect, and it is weight.** It updates `profile.weight_kg` server-side
  through the same range guard the manual form uses, and only when its measurement is NEWER than
  `weight_measured_at` — otherwise a sync firing seconds after the user types their weight silently
  reverts it. A weight TYPED for the same day or later outranks it whatever its stamp, as it does
  in the merged log, and a reading over 10% from the one before it waits for the next to confirm
  it (ieat-app#1233: one bad sample replaced a typed 96 kg with 70.2). Activity, energy and sleep are stored, shown, and change nothing: the activity
  multiplier already prices activity into TDEE, so adding active energy on top double-counts it and
  erases the deficit. `targets.ts` is untouched by health.
- **The chat thread is stored on the server, and the engine writes it.** `chat_messages` /
  `Store.appendChat`, written by the engine function that PRODUCED the turn (`handleText`,
  `logPhotoMeal`, `confirmPendingMeal`, `cancelPendingMeal`, `editMeal` via `engine/chat.ts`).
  The app may add ONLY through `POST /v1/messages/lines`: the user's own words, and Spud's scripted
  lines BY ID (`SCRIPTED_LINES` in `src/shared/chat.ts`) — never assistant prose from a client,
  because a phone must not be able to put a sentence in Spud's mouth. Spud's first verdict is
  `firstVerdictLines`, deterministic and spoken once. The Chat tab (`GET /v1/messages`) is the
  thread's continuation, so it never shows a line the server does not have. A photo bubble carries
  the meal id and fetches the picture through the scoped route; no bytes travel in a line. A meal card stores the meal ID and is resolved on READ (`chatHistory`),
  so it shows the meal as it is now and a verdict never outlives its numbers. A proposal writes
  the words when they are said and the card only when confirmed, so a turn taken while the card
  sits keeps its place; a refused turn writes nothing; a thread write that fails never fails the
  turn. Erased with the account (it holds the medical free
  text), moved by an anonymous→real merge, and never joined to `onboarding_events` — the funnel
  stays answer-free.
- **A question in chat goes to the coach, and the coach's tools are closures over ONE user id.**
  `engine/coach.ts`. The router (`routeText`) still decides what a message IS — a described meal,
  a correction, a re-date are confirm-first and unchanged — and hands a question to `llm.coach`
  with the last `COACH_HISTORY_LINES` thread lines, the plan and why it is what it is, today, the
  week, and two read-only tools: `get_meals` (a date window ≤ 31 days, ≤ 60 rows, via
  `store.mealsSince`) and `get_health` (≤ 90 days). THE ENGINE BUILDS THE CLOSURES; the port that
  runs the loop (`openrouter.ts`, at most `MAX_COACH_ROUNDS` tool rounds and then one forced
  answer with `tool_choice: "none"`, the whole turn inside ONE `llmTimeoutMs`) never sees an
  account and cannot reach a row on its own — the one place a
  model output would otherwise choose whose rows to read. Every replayed line and the message pass
  `normalizePromptText`: the thread holds words the model wrote and words the user typed, and both
  are read back into a prompt. A tool's failure reaches the model as `{ error }` and its message
  reaches the log only — a query can carry the medical free text. The reply carries up to three
  `suggestions`, chips for the LIVE turn only; the thread stores the sentence. The router's own
  sentence is the fallback when the coach fails, so an outage is today's chat, never
  `analysis-failed` on a turn already charged. The coach has its own model,
  `EAIT__BACKEND__LLM_CHAT_MODEL` (text only; the analyzer keeps the vision one), and the
  persona and its rules are one prompt, `SYSTEM_COACH`, with a test naming each rule.
- **The web session cookie is `/start`'s alone.** `src/backend/web/start.ts` reads it and nothing
  else does — `resolveUserId` in `api/routes.ts` stays bearer-only, because an API that accepts a
  cookie is an API another origin can post to on a signed-in browser. `SameSite=Lax` is what
  protects the forms (a cross-site POST carries no Lax cookie), which is why every state change
  there is a POST; the one GET that changes anything is the OAuth callback, and what protects that
  is comparing `state` against its own cookie. Without that comparison a stranger finishes a sign-in
  as themselves in somebody else's browser, and that person then types their weight into the
  stranger's account.
- **An identity comes out of a verified token, never out of a request.** `auth/verify.ts` checks
  signature, issuer, expiry AND audience. Skipping the audience check makes any other app's token a
  valid login here. An unconfigured audience list must refuse the route, never verify without it.
- **A provider that cannot sign anybody in is not a way into an account.** `signsIn` (in
  `src/shared/contract.ts`, beside `PROVIDERS`) is the one predicate, and every rule that reads
  `identities` to decide who can reach an account asks it: `removeIdentity` deletes the account when
  the last SIGN-IN identity goes, and `isAnonymous` ignores anything that is not one. `telegram` is
  a transport onto an account made elsewhere and mints no session. Counted as a way in, one row made
  two older rules wrong at once — an account survived with nothing that could ever sign into it, and
  a device account with a bot connected stopped merging on its owner's first real sign-in.
- **Merging is anonymous→real only.** `engine/identity.ts`. Two accounts that both carry a real
  identity are never merged — there is no safe answer to whose profile survives. And a merge DROPS
  the anonymous device identity rather than repointing it, or signing out would let plain device
  auth walk straight back in. Both store implementations must agree; a test asserts it.
- **The email scope is requested and the address is stored; nothing wider is.** Apple:
  `AppleAuthenticationScope.EMAIL`. Google: `scopes: ["openid", "email"]` — still NOT
  `expo-auth-session/providers/google`, because that wrapper unions whatever you pass with
  `userinfo.profile` as well and offers no way out (`applyRequiredScopes`), which would put a name
  and a picture on the consent screen and in the token: two personal fields nothing here reads. The
  `sub` claim is still the whole account key and nothing authenticates with an address. It lands on
  the `identities` row through `setIdentityEmail`, called AFTER the branch in `signInWithProvider`
  — a returning user links nothing, and that is the only path an account created before this will
  ever take again. Apple sends the address on the FIRST authorization and never again, so an
  absent one must never overwrite a stored one. Asking for it obliges Apple's
  `response_mode=form_post` on the web, which `web/start.ts` bridges back to a GET so the
  `SameSite=Lax` state cookie still guards the callback. The old "no email, no name"
  promise is refused on the admin WRITE and on the READ (`retired-no-email` in `claims.ts`,
  `usableWelcome`), because onboarding copy is stored per host and outlives the binary that shipped it.
  The redirect is the BUNDLE ID scheme, the one of Google's two accepted forms that Expo's
  scheme plugin already registers; writing `ios.infoPlist.CFBundleURLTypes` to take the other turns
  that plugin off and drops the app's own deep links.
- **A system prompt is AUTHORED in `src/backend/llm/prompt.ts` and SERVED from a row** of
  `llm_prompts`, so it can be edited without a deploy. No second prompt string is written in the
  SOURCE, and the six constants are where the text is authored. **Every store comes up holding them as rows** — `memoryStore` in its constructor,
  `postgresStore` by running `syncShippedPrompts` at boot — so a test, a `./dev` stack and a
  self-hosted deployment all read a prompt the way production does instead of testing the fallback
  and shipping the row. The fallback is still there and still tested: an empty table, a deleted row,
  a row that fails containment or a database that is down all resolve back to the constants
  (`loadPrompts`, which cannot throw). It is the safety net, not the normal state.
- **A prompt row says WHO wrote it, and that column is what keeps the constants authoritative.**
  Once rows exist everywhere, rows win — so without `source` a prompt edited in `prompt.ts` could
  never reach a host that had booted once, and the constants would quietly stop being the source of
  truth. `syncShippedPrompts` writes a key with no revision, and rewrites one whose LIVE revision
  the shipper wrote when the constant has moved; a key whose live revision an ADMIN wrote is never
  touched, because a human override must outrank a deploy. Restoring the shipped text through the
  admin is a save, so it stays the admin's. The sync runs at startup and **cannot fail a boot**: two
  instances racing for one `(key, version)` and a read-only database both end at a server that
  serves. This is also the answer to the objection `onboarding_content` records against seeding on
  boot — "it makes 'has an admin ever touched this?' unanswerable" — which here is a column.
- **Three surfaces edit a prompt, and they share one gate.** `GET`/`PUT /admin/api/prompts` and
  `GET /admin/api/prompts/:key/revisions` behind the admin role; the panel in `api/admin.page.ts`;
  and `./dev prompts` (`src/scripts/prompts.ts`), which reaches Postgres directly because an
  operator on the box has the database URL and may not have a bearer. **All three call
  `savePrompt`** — a second writer would be a second set of rules, and the one it would drift from
  decides what a model may be told. A save that loses the `(key, version)` race answers **409, not
  422**: the prose was fine and a retry succeeds, and telling somebody their writing was refused
  sends them to rewrite a prompt that was never the problem. There is no reset verb, because a
  restore IS a save — it keeps the row `admin`, so the next deploy still leaves it alone, and it
  stays in the history where a delete would have left a gap.
- **The admin page's script is the one code here no gate reads.** The whole document is a template
  literal, so `tsc` never looks inside it and `bun test` never runs it; a `null` dereference there
  reaches production with every check green. `web/browser/admin-prompts.pw.ts` is what covers the
  prompts panel — it fetches the real page and stubs only `/admin/api/*`, so what is under test is
  the page's own JavaScript. The page is a shell: hash routes (`#numbers` … `#food`), one view at a time, each fetching its own data the first time it opens, so a failing endpoint is an error INSIDE its view and the gate/denied cards come from the session check alone (the push-templates read, which also feeds the nav badge: 404 is denied, 401 is signed out). Its tokens and typeface are `shared/palette.ts` / `design.ts`, hence `font-src 'self'` in its CSP. (And: no backtick may appear anywhere inside that literal. The failure
  is a parse error a hundred lines away.)
- **What did NOT move, and must not:** `normalizePromptText` (a containment boundary, not editable
  content), every `build*` function (they interpolate the user's own data and enforce its caps — a
  stored template would be a language this repo then owns), the Zod schemas, and `COACH_TOOL_DEFS`
  (both structurally coupled to what the engine parses into). A stored prompt replaces the TEXT of
  one system message and reaches nothing else: it is JSON-escaped into that field, so text shaped
  like a second message, a tool definition or a tool result stays text.
- **Validated on the WRITE** (`validateStoredPrompt`, via `savePrompt`), because a stored prompt
  meets no reviewer and no typecheck. It is not `normalizePromptText` and differs from it twice: the
  shape rules are dropped (a prompt is the FRAME around a span, so its newlines and quotes survive),
  and the character rules are STRICTER — every Unicode format character rather than an enumerated
  handful, because text through that function is rendered on a card where a person sees it, and a
  stored prompt is read by nobody before a model reads it. Emoji survive; only LONE surrogates are
  refused. Refused, never repaired: silently deleting a character changes what the model was asked
  without telling anyone. The table is **append-only** (`(key, version)`), because an edit that
  changes model behaviour with no record is the failure mode here — `store.promptRevisions` is the
  trail. **Global rows, no `user_id`, and that is safe because a prompt is not a user's data**: it
  is what this server sends on behalf of every account, so there is no query here to widen past one.
  `PROMPT_KEYS` is the set of prompts that exist; the `llm_prompts` check constraint spells the same
  six out by hand, and `prompt.schema.test.ts` fails naming the key when the two disagree, so a
  seventh prompt cannot half-land. What would falsify all of this: a per-user prompt (it would need
  the scoping), or any builder, schema or tool definition following the prose into the table.
- **Public copy passes a claims gate before it is written, not before it is reviewed.** The rule
  set is `src/shared/claims.ts`, and the landing build is one caller of it. The rule is
  `src/shared/AGENTS.md` § Localization (#358). Its copy of the marketing repo's rule set, and why
  it is a copy, is the header of `src/shared/claims.ts`.
- **A number quoted in public copy is read from the code that produces it,** and a test fails when
  the copy and the constant disagree. A safety guarantee described in marketing that the app does
  not implement is the worst sentence this repo could publish.
- **A container sees only what its service's `environment:` block names.** A compose `--env-file`
  feeds interpolation, not the container's environment, so a variable absent from that block
  reaches nothing, however configured it looks from the host.
- **The photo route streams when asked, and the last line is the answer.** `POST /v1/meals/photo`
  with `accept: application/x-ndjson` answers `200` at once and writes one JSON object per line:
  a `reading` line, an `item` per object the
  analyzer closes inside `items` (`llm/partial.ts`, a scanner over the streamed JSON), and the
  `LogPhotoResult` LAST — refusals included, because the status went out with the first byte.
  Everything the route rejects BEFORE the engine runs is still an HTTP status. Without the header
  it is the JSON route it always was, and `logPhotoMeal` without `onEvent` streams nothing.
  The pending card renders item NAME and GRAMS only; the kcal, the macros and the verdicts are the
  final card's, so nothing provisional is a number the product later contradicts. Measured
  2026-09-05: the 30 s wait was grok-4.5's reasoning — a median 37 s to first
  visible token, 0 to 4433 reasoning tokens on the SAME photo — and that endpoint refuses to switch
  reasoning off, which is why the analyzer runs a model that does not reason and
  `EAIT__BACKEND__LLM_REASONING_EFFORT` ships `off`.
- **A queued photo is the same turn, answered later** (ieat-app#1318, #414). Jobs run on
  **pg-boss** (schema `pgboss`, one queue per `<kind>-v<version>`, so a build claims only what it
  can run). `POST /v1/meals/photo/queue` answers 202 once `enqueueJob` has claimed the turn, sent
  the job and stored the photos unadopted, in one transaction; the `clientId` is the job id and
  `turns` keeps the outcome. Every replica runs a worker (`startJobs` in `engine/photo-queue.ts`),
  `EAIT__BACKEND__JOB_CONCURRENCY` at once. Every write an attempt makes is fenced by
  `state = 'active'` and its owner, so an attempt pg-boss has retried writes nothing more. A job
  runs at most twice (`retryLimit` 1), a photo only while it has no meal. `expireJobs` settles
  `OUTCOME_UNKNOWN` what nobody ran within `EAIT__BACKEND__JOB_MAX_QUEUED_MS` and what pg-boss
  failed. SIGTERM stops claiming, waits up to `EAIT__BACKEND__SHUTDOWN_DRAIN_MS` and hands the
  rest back to the queue. The follow stream re-reads on `LISTEN eait_job` (payload
  `userId:clientId`, never content) and every 2 s; the worker wakes on `eait_jobs` and polls every
  5 s. `claimPush` sends the one push, only when nobody was following.
  **What a job shows lives in its pg-boss `data`** and `job_rows` is the one view that reads it.
  pg-boss's `update()` edits only queued jobs, so running-job writes are raw SQL on `pgboss.job`;
  that schema has no row-level security, so every statement names `data->>'userId'`, and a
  trigger on `users` deletes a user's jobs. Before bumping pg-boss, check its schema against
  `job_rows`.
- **A meal update is the same job, with the meal's own id** (ieat-app#1347). `POST /v1/meals/update/queue`
  takes an ingredient edit (`editMeal`), a chat correction (`textTurn` with `focusMealId`) or a re-read
  (`reanalyzeMeal`) and queues it as a `meal-update` job, followed and removed on the
  photo job's route in the same `PhotoJob`; `update` on a running job names its kind and step count (2, 3, 3).
  The numbers stay the old ones until the write lands. POST /v1/messages and PATCH /v1/meals/:id stay: shipped
  builds call them. A dead worker's `ingredients` or `reread` re-runs once; a `note` never does (its
  chat lines would repeat) and settles `OUTCOME_UNKNOWN`.
- **There is no cross-sender daily cap on pushes** (Kirill, ieat-app#1965; the Telegram bot's
  one-a-day rule does not apply to app pushes). `push_claim` is one row per `(user, local day,
  sender)` and exists for idempotency: the tick runs every minute on two replicas, so each sender
  claims its day BEFORE it sends. The sender is `pushSenderOf(kind, ref)` — the tick's scheduled
  message (a trigger or the evening line, one sender), `meal:<slot>` (the web push for a per-meal
  reminder slot, ieat-app#2149: breakfast, lunch and dinner each claim their own day, send to browsers
  only and never touch `push_slot`) or `campaign:<ref>` (a campaign id,
  `admin-test`, or one composer send: `admin:<adminId>:<request uuid>`, so composer sends are not
  limited to one a day). **The only bound is per account**: `users.push_daily_max` (admin,
  Accounts), else `EAIT__BACKEND__PUSH_DAILY_MAX`, else none, counted over that day's claims inside one
  transaction that holds the account row's lock to the insert; a lost race on the same sender is
  `sender-taken`, never a throw. **`claimSend` (`engine/notify.ts`) is the one place every sender claims**,
  so a refusal there (`sender-taken` or `account-cap`) is the whole rule; a new sender calls it and
  nothing else. A campaign is once per account (`claimCampaignSend`); a repeat setting is added
  only when a campaign needs one. On the trial-ends day the phone's local reminder stays and the
  evening line goes as well. The staff test push (`sendTestPush`, users.staff
  or EAIT__BACKEND__CAMPAIGN_STAFF_IDS as a bootstrap fallback) claims nothing and is bounded by
  `TEST_PUSH_DAILY_CAP` (`test-cap`, 409), a stuck-button bound and not a product rule; a non-staff
  test is the `admin-test` sender. Apple 4.5.4 holds (promotional only with tips and offers
  on), as do the account-wide notifications switch and the claims gate. `push_slot` is written by the
  scheduled sender only while a build that still reads it can run; drop it with that shim.
- **The singletons run on the LEADER, and leadership is a Postgres advisory lock** (#414). The
  evening line, the daily sweeps (health retention, turn outcomes, settled jobs, abandoned accounts, idle
  tokens, expired pendings) and the Telegram poll each exist once per cluster, not once per
  process: `index.ts` contests `store.tryLeadership()` every 15 s, the lock is a session lock on
  its own connection so it dies with the holder, and a SIGTERM drains then releases rather than
  making the next leader wait. The 20:30 line's second lock is its `push_claim` row,
  claimed atomically before the send — a second leader mid-handover finds the day already taken.
  `migrate()` runs under a second advisory lock, because two replicas can boot at once.
