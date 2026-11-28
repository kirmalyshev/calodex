// The web "+ Log" chooser's Search (#909) and saved meals (#907, calodex_app#3685): a full-width
// sheet (560 px dialog on desktop) — the field, Cancel (Done once something was logged), "Logging
// to today · N kcal left", her saved meals while the field is empty, and the catalog's rows with
// a round + plus "Ask in Chat" and "Enter numbers" once she types. One tap logs a catalog food's
// serving or re-logs a saved meal onto today (`POST /v1/saved-meals/:id/log { dayOffset: 0 }`); the sheet stays
// open. Nothing is estimated here: the server reads the numbers and computes verdicts after the write.

import type { FoodSearchResponse, SavedMeal } from "@eait/shared/contract";
import type { FoodRef } from "@eait/shared";
import { numbersCopyFor } from "../../shared/app/numbers-copy.ts";
import { foodLogChoice, foodSearchCopyFor, isLoggableFood } from "../../shared/app/food-search-copy.ts";
import { savedMealsCopyFor } from "../../shared/app/saved-meals-copy.ts";
import { UNIT_KCAL, kcalNumbers, wholeNumbers } from "../../shared/lang.ts";
import type { Lang } from "../../shared/types.ts";
import { ApiError, api, apiBlob, deleteSavedMeal, listSavedMeals, logSavedMeal } from "../api.ts";
import { fillCopy as fill } from "../copy.ts";
import { ico } from "../../shared/ui/kit.ts";
import { blobSrc, gramMacsEl, kitEl } from "../kit.ts";
import { clampRowSwipe, shouldOpenRowSwipe } from "../row-swipe.ts";
import { COPY, el } from "../shell.ts";

export interface FoodSearchOpts {
  lang: Lang;
  /** kcal left on the target day, or null when the day could not be read — the line is left out. */
  left: number | null;
  /** Her words go to the composer, as a typed meal does today. */
  onTell: (q: string) => void;
  /** "Enter numbers": the typed-numbers sheet, the query as its name. */
  onNumbers: (q: string) => void;
  onClose: () => void;
  /** A meal landed: the chat's own thread and today's totals are stale. */
  onLogged: () => void;
}

const DEBOUNCE_MS = 250;
const SAVED_REMOVE_WIDTH = 88;

export function foodSearchSheet(o: FoodSearchOpts): HTMLElement {
  const c = foodSearchCopyFor(o.lang);
  const nc = numbersCopyFor(o.lang);
  const sc = savedMealsCopyFor(o.lang);
  const num = wholeNumbers(o.lang);
  const kn = kcalNumbers(o.lang);
  let left = o.left;
  let seq = 0;
  let savedMeals: SavedMeal[] | null = null;
  const savedLogged = new Set<string>();
  const inflight = new Set<string>();
  const removeFailedIds = new Set<string>();
  let hot = -1;
  const photoCache = new Map<string, Promise<string | null>>();

  const sheet = el("div", "fs");
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-label", c.plusSearch);
  const head = el("div", "fs-head");
  const field = el("input", "fs-field") as HTMLInputElement;
  field.type = "search";
  field.placeholder = c.placeholder;
  field.setAttribute("aria-label", c.placeholder);
  field.autocomplete = "off";
  const close = el("button", "fs-close", c.cancel) as HTMLButtonElement;
  close.type = "button";
  close.addEventListener("click", o.onClose);
  head.append(field, close);
  const line = el("p", "fs-line");
  const body = el("div", "fs-body");
  const source = el("p", "fs-source");
  sheet.append(head, line, body, source);

  const drawLine = (): void => {
    line.textContent = left === null ? "" : fill(c.logging, { day: c.today, left: num(Math.max(0, left)) });
  };
  drawLine();

  // Swipe-left to remove a saved meal on narrow/touch (`log-pw1-search-remove`): one row open at a time.
  let openSwipe: HTMLElement | null = null;
  const closeOpenSwipe = (): void => {
    if (openSwipe === null) return;
    openSwipe.classList.remove("open");
    const fg = openSwipe.querySelector<HTMLElement>(":scope > .fs-saved");
    if (fg !== null) { fg.style.transition = ""; fg.style.transform = ""; }
    openSwipe = null;
  };
  sheet.addEventListener("pointerdown", (e) => {
    if (openSwipe !== null && e.target instanceof Node && !openSwipe.contains(e.target)) {
      closeOpenSwipe();
    }
  }, true);

  const photoFor = (mealId: string): Promise<string | null> => {
    let hit = photoCache.get(mealId);
    if (hit === undefined) {
      hit = apiBlob(`/meals/${encodeURIComponent(mealId)}/photos/0`).then(blobSrc).catch(() => null);
      photoCache.set(mealId, hit);
    }
    return hit;
  };

  const removeSaved = (m: SavedMeal): void => {
    if (savedMeals === null) return;
    const idx = savedMeals.findIndex((x) => x.id === m.id);
    if (idx < 0) return;
    closeOpenSwipe();
    removeFailedIds.delete(m.id);
    savedMeals = savedMeals.filter((x) => x.id !== m.id);
    if (field.value.trim() === "") { renderSaved(); field.focus(); }
    void deleteSavedMeal(m.id).catch(() => {
      if (savedMeals === null || savedMeals.some((x) => x.id === m.id)) return;
      const next = [...savedMeals];
      next.splice(Math.min(idx, next.length), 0, m);
      savedMeals = next;
      removeFailedIds.add(m.id);
      if (field.value.trim() === "") renderSaved();
    });
  };

  const savedRow = (m: SavedMeal): HTMLElement => {
    const box = el("div", "fs-srow");
    const row = el("div", "fs-row fs-saved");

    // The accent-tinted chat disc is the base; the source meal's first photo covers it while it
    // still exists (a 404 keeps the disc, matching iOS SavedMealsList).
    const tile = el("span", "fs-tile");
    tile.append(kitEl(ico("chat")));
    void photoFor(m.source_meal_id).then((src) => {
      if (src === null || !tile.isConnected) return;
      const img = el("img", "ph") as HTMLImageElement;
      img.src = src;
      img.alt = "";
      tile.append(img);
    });

    const txt = el("div", "fs-txt");
    const fail = el("div", "fs-fail");
    fail.setAttribute("role", "alert");
    fail.hidden = !removeFailedIds.has(m.id);
    if (removeFailedIds.has(m.id)) fail.textContent = sc.removeFailed;
    txt.append(
      el("b", "", m.name),
      el("div", "fs-sub", `${kn(m.kcal)} ${UNIT_KCAL[o.lang]}`),
      gramMacsEl({ protein: m.protein_g, carbs: m.carbs_g, fat: m.fat_g }),
      fail,
    );

    const add = el("button", "fs-add") as HTMLButtonElement;
    add.type = "button";
    const face = (done: boolean): void => {
      add.classList.toggle("fs-done", done);
      add.setAttribute("aria-label", fill(done ? sc.loggedLabel : sc.logLabel, { name: m.name }));
      add.setAttribute("aria-disabled", String(done || inflight.has(m.id)));
      add.disabled = done || inflight.has(m.id);
      add.replaceChildren(el("i", `ico i-${done ? "check" : "plus"}`));
    };
    face(savedLogged.has(m.id));
    let busy = false;
    add.addEventListener("click", async () => {
      if (busy || inflight.has(m.id) || add.classList.contains("fs-done")) return;
      busy = true;
      inflight.add(m.id);
      add.disabled = true;
      add.setAttribute("aria-disabled", "true");
      fail.hidden = true;
      try {
        const res = await logSavedMeal(m.id);
        if (res.kind === "target-gone") {
          savedMeals = savedMeals?.filter((x) => x.id !== m.id) ?? savedMeals;
          if (field.value.trim() === "") renderSaved();
          return;
        }
        savedLogged.add(m.id);
        face(true);
        close.textContent = c.done;
        if (left !== null) { left -= res.analysis.kcal; drawLine(); }
        o.onLogged();
      } catch (e) {
        const code = e instanceof ApiError ? e.body?.error : undefined;
        fail.textContent = code !== undefined && Object.hasOwn(COPY.refusals, code) ? COPY.refusals[code]! : c.logFailedWeb;
        fail.hidden = false;
      } finally {
        busy = false;
        inflight.delete(m.id);
        if (!add.classList.contains("fs-done") && add.isConnected) {
          add.disabled = false;
          add.setAttribute("aria-disabled", "false");
        }
      }
    });

    row.append(tile, txt, add);

    // Swipe-left red Remove tray on narrow/touch; hover/focus trash button on fine-pointer desktop.
    const rem = el("button", "fs-srem") as HTMLButtonElement;
    rem.type = "button";
    rem.title = sc.remove;
    rem.setAttribute("aria-label", fill(sc.removeLabel, { name: m.name }));
    rem.append(kitEl(ico("trash")), el("span", "fs-srem-lbl", sc.remove));
    rem.addEventListener("click", (e) => {
      e.stopPropagation();
      removeSaved(m);
    });

    box.append(row, rem);

    let drag: { x: number; y: number; id: number; wasOpen: boolean; moved: boolean } | null = null;
    const isSwipeMode = (): boolean => getComputedStyle(rem).position === "absolute";
    box.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || !isSwipeMode()) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest(".fs-srem, .fs-add") !== null) return;
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId, wasOpen: box.classList.contains("open"), moved: false };
    });
    box.addEventListener("pointermove", (e) => {
      if (drag === null || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5 && (dx < 0 || drag.wasOpen)) {
        drag.moved = true;
        if (openSwipe !== null && openSwipe !== box) closeOpenSwipe();
        try { box.setPointerCapture(e.pointerId); } catch { /* pointer gone */ }
      }
      if (drag.moved) {
        row.style.transition = "none";
        row.style.transform = `translateX(${clampRowSwipe(drag.wasOpen ? -SAVED_REMOVE_WIDTH : 0, dx, SAVED_REMOVE_WIDTH)}px)`;
      }
    });
    const finishDrag = (dx: number, commit: boolean): void => {
      if (drag === null) return;
      const { wasOpen, moved } = drag;
      drag = null;
      row.style.transition = "";
      row.style.transform = "";
      if (!moved) return;
      const open = commit && shouldOpenRowSwipe(wasOpen, dx);
      if (open) {
        if (openSwipe !== null && openSwipe !== box) closeOpenSwipe();
        box.classList.add("open");
        openSwipe = box;
      } else {
        box.classList.remove("open");
        if (openSwipe === box) openSwipe = null;
      }
    };
    box.addEventListener("pointerup", (e) => {
      if (drag !== null && e.pointerId === drag.id) finishDrag(e.clientX - drag.x, true);
    });
    box.addEventListener("pointercancel", (e) => {
      if (drag !== null && e.pointerId === drag.id) finishDrag(0, false);
    });
    return box;
  };

  const renderSaved = (): void => {
    closeOpenSwipe();
    hot = -1;
    const nodes: HTMLElement[] = [el("div", "lab fs-sec", sc.section)];
    if (savedMeals !== null) {
      if (savedMeals.length === 0) nodes.push(el("p", "fs-empty", sc.empty));
      else nodes.push(...savedMeals.map(savedRow));
    }
    body.replaceChildren(...nodes);
    source.textContent = "";
  };

  const tellRow = (q: string): HTMLElement => {
    const row = el("button", "fs-row fs-tell") as HTMLButtonElement;
    row.type = "button";
    const disc = el("span", "fs-disc");
    disc.append(kitEl(ico("chat")));
    const txt = el("div", "fs-txt");
    txt.append(el("b", "", fill(c.tell, { q })));
    row.append(disc, txt, el("i", "ico i-chevron-right"));
    row.addEventListener("click", () => { o.onClose(); o.onTell(q); });
    return row;
  };

  // Beside "Ask in Chat": typed numbers, the name prefilled from the query (#2088).
  const numbersRow = (q: string): HTMLElement => {
    const row = el("button", "fs-row fs-numbers") as HTMLButtonElement;
    row.type = "button";
    const disc = el("span", "fs-disc fs-disc-n");
    disc.append(kitEl(ico("numbers")));
    const txt = el("div", "fs-txt");
    txt.append(el("b", "", nc.enter), el("div", "fs-sub", fill(nc.rowNamed, { q })));
    row.append(disc, txt, el("i", "ico i-chevron-right"));
    row.addEventListener("click", () => o.onNumbers(q));
    return row;
  };

  const foodRow = (f: FoodRef): HTMLElement => {
    const ch = foodLogChoice(f);
    const row = el("div", "fs-row");
    const txt = el("div", "fs-txt");
    const fail = el("div", "fs-fail");
    fail.setAttribute("role", "alert");
    fail.hidden = true;
    txt.append(
      el("b", "", f.names[o.lang] ?? (o.lang === "de" ? f.name_de : o.lang === "en" ? f.name_en : null) ?? f.name),
      el("div", "fs-sub", fill(c.serving, { label: ch.label ?? c.hundredGrams, kcal: num(ch.kcal) })),
      fail,
    );
    const add = el("button", "fs-add") as HTMLButtonElement;
    add.type = "button";
    const name = f.name;
    const face = (done: boolean): void => {
      add.classList.toggle("fs-done", done);
      add.setAttribute("aria-label", fill(done ? c.logged : c.log, { name }));
      add.replaceChildren(el("i", `ico i-${done ? "check" : "plus"}`));
    };
    face(false);
    let busy = false;
    add.addEventListener("click", async () => {
      if (busy || add.classList.contains("fs-done")) return;
      busy = true;
      add.disabled = true;
      add.setAttribute("aria-disabled", "true");
      fail.hidden = true;
      try {
        await api("/foods/log", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ref: f.id, grams: ch.grams, clientId: crypto.randomUUID(), capturedAt: new Date().toISOString() }),
        });
        face(true);
        close.textContent = c.done;
        if (left !== null) { left -= ch.kcal; drawLine(); }
        o.onLogged();
      } catch (e) {
        // A 402 is the paywall: a browser has no sheet, so the refusal says where subscribing happens.
        const code = e instanceof ApiError ? e.body?.error : undefined;
        fail.textContent = code !== undefined && Object.hasOwn(COPY.refusals, code) ? COPY.refusals[code]! : c.logFailedWeb;
        fail.hidden = false;
      } finally {
        busy = false;
        if (!add.classList.contains("fs-done") && add.isConnected) {
          add.disabled = false;
          add.setAttribute("aria-disabled", "false");
        }
      }
    });
    row.append(txt, add);
    return row;
  };

  const run = async (q: string): Promise<void> => {
    const mine = ++seq;
    if (q === "") { renderSaved(); return; }
    closeOpenSwipe();
    try {
      const r = await api<FoodSearchResponse>(`/foods?q=${encodeURIComponent(q)}&limit=20`);
      if (mine !== seq) return;
      const rows = r.foods.filter(isLoggableFood);
      body.replaceChildren(
        ...(rows.length === 0 ? [el("p", "fs-none", fill(c.noMatch, { q }))] : rows.map(foodRow)),
        tellRow(q),
        numbersRow(q),
      );
      source.textContent = rows.length === 0 ? "" : r.attributions.map((a) => a.citation).join(" · ");
    } catch {
      if (mine !== seq) return;
      const retry = el("button", "fs-retry", c.retry) as HTMLButtonElement;
      retry.type = "button";
      retry.addEventListener("click", () => { void run(q); });
      const msg = el("p", "fs-failed", `${c.searchFailed} `);
      msg.append(retry);
      body.replaceChildren(msg);
      source.textContent = "";
    }
  };

  // Load saved meals on open so the empty search screen shows them immediately (#907).
  renderSaved();
  void listSavedMeals().then(
    (meals) => { savedMeals = meals; if (field.value.trim() === "") renderSaved(); },
    () => { savedMeals = []; if (field.value.trim() === "") renderSaved(); },
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  field.addEventListener("input", () => {
    clearTimeout(timer);
    hot = -1;
    timer = setTimeout(() => { void run(field.value.trim()); }, DEBOUNCE_MS);
  });
  // ↑/↓ move a highlight over the rows (saved rows, or catalog rows then "Tell"); Return picks it.
  // With nothing highlighted and text typed, Return is the board's "Tell" — her words go to Chat.
  const rowsNow = (): HTMLElement[] => [...body.querySelectorAll<HTMLElement>(".fs-row")];
  const paintHot = (): void => {
    rowsNow().forEach((r, i) => r.classList.toggle("fs-hot", i === hot));
    rowsNow()[hot]?.scrollIntoView({ block: "nearest" });
  };
  field.addEventListener("keydown", (e) => {
    const rows = rowsNow();
    if (e.key === "ArrowDown" && rows.length > 0) { e.preventDefault(); hot = Math.min(hot + 1, rows.length - 1); paintHot(); }
    else if (e.key === "ArrowUp" && rows.length > 0) { e.preventDefault(); hot = Math.max(hot - 1, -1); paintHot(); }
    else if (e.key === "Enter") {
      const pick = hot >= 0 ? rows[hot] : undefined;
      if (pick !== undefined) {
        e.preventDefault();
        const add = pick.querySelector<HTMLElement>(".fs-add");
        if (add !== null) add.click(); else pick.click();
      } else if (field.value.trim() !== "") {
        e.preventDefault();
        o.onClose();
        o.onTell(field.value.trim());
      }
    }
    if (e.key === "Escape") {
      if (openSwipe !== null) closeOpenSwipe();
      else o.onClose();
    }
  });
  queueMicrotask(() => field.focus());
  return sheet;
}
