// The pay screen's own styles (#263, ieat-app#3465) — the phone's Cal AI sheet, full-screen over
// the app: the nav leaves the tree and the pane is a phone-width column centred at any width (at
// 1440 the same sheet centred, never a split). The sells-nothing fallback still draws the kit's
// plan rows (`payPlansEl`).

export const payCss = `
body:has(.pay) .wtop { display: none; }
.pay { position: fixed; inset: 0; z-index: 60; background: var(--bg); overflow-y: auto; }
.pay .sheet { min-height: 100%; max-width: 430px; margin: 0 auto; display: flex;
  flex-direction: column; position: relative; }
.pay .x { position: absolute; left: 12px; top: 12px; z-index: 2; }
.pay .hero { flex: 1; min-height: 96px; position: relative; }
.pay .hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  display: block; }
/* The foot (the phone's s.foot): a hairline over it and the CTA block inside. On B/C the hero is
   gone — the pane takes the whole sheet and loses the border (the phone's B draws none). */
.pay .pane { display: flex; flex-direction: column; padding: 12px 20px
  calc(12px + env(safe-area-inset-bottom, 0px)); }
.pay .sheet:has(.hero) .pane { border-top: 1px solid var(--hair); }
.pay .sheet:not(:has(.hero)) .pane { flex: 1; padding-top: 76px; }
.pay .pcol { display: flex; flex-direction: column; gap: 12px; flex: 1; }
.pay .pcol h1 { margin: 0 0 6px; text-align: center; }
.pay .pcol > p { margin: 0; }
.pay .pcol > .t12, .pay .pcol > .t13 { text-align: center; }
.pay .pcol .mid { flex: 1; display: flex; align-items: center; justify-content: center; }
.pay .paylinks { display: flex; justify-content: center; align-items: center; min-height: 32px; }
.pay .paylinks a { color: inherit; text-decoration: underline; }
/* A's plan rows (Cal AI 04, ieat-app#3442): Yearly over Monthly — the trial band on top, the check,
   the name (with its saving tag) and the billed price under it, the per-month figure on the right. */
.pay .pwp2 { display: flex; flex-direction: column; gap: 10px; }
.pay .plan2 { display: flex; flex-direction: column; background: var(--surface); border-radius: 14px;
  box-shadow: 0 0 0 1px var(--line); cursor: pointer; position: relative; overflow: hidden; }
.pay .plan2 input[type=radio] { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
.pay .plan2:has(>input:checked) { box-shadow: 0 0 0 2px var(--ink); }
.pay .plan2:focus-within { box-shadow: 0 0 0 2px var(--ink); }
.pay .plan2 .band { background: var(--hair); color: var(--ink); font-size: 12px; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase; text-align: center; padding: 4px 0; }
.pay .plan2:has(>input:checked) .band { background: var(--ink); color: var(--surface); }
.pay .plan2 .nr { display: flex; align-items: center; gap: 12px; padding: 14px; }
.pay .plan2 .ck { width: 22px; height: 22px; flex: 0 0 22px; border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--line); position: relative; }
.pay .plan2:has(>input:checked) .ck { background: var(--accent); box-shadow: none; }
.pay .plan2:has(>input:checked) .ck::after { content: ""; position: absolute; left: 7px; top: 3px;
  width: 6px; height: 11px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.pay .plan2 .nmc { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.pay .plan2 .nm { font-size: 16px; font-weight: 600; }
.pay .plan2 .billed { font-size: 14px; font-weight: 600; } /* 3.1.2(c): as heavy as the per-month figure */
.pay .plan2 .pm { font-size: 14px; font-weight: 600; }
.pay .plan2:not(:has(>input:checked)) :is(.nm, .billed, .pm) { color: var(--muted); }
/* B's timeline (Cal AI 06): a dot per step with its icon, the rail between them — the second rail
   is the line's colour, like the phone's stepRailOff. */
/* margin: auto 0 centres the timeline in the column's free height (ieat-app#3505) — the phone's
   s.tryMid: no photo on B, so nothing floats between the title and the CTA block. */
.pay .tl { list-style: none; margin: auto 0; padding: 0; }
.pay .tl li { position: relative; display: grid; grid-template-columns: 36px 1fr; column-gap: 14px;
  padding-bottom: 20px; }
.pay .tl li:last-child { padding-bottom: 0; }
.pay .tl li .td { grid-row: span 2; width: 36px; height: 36px; border-radius: 50%;
  background: var(--accent); display: flex; align-items: center; justify-content: center; }
.pay .tl li .td .ico { width: 18px; height: 18px; background: var(--accent-ink); }
.pay .tl li:not(:last-child)::after { content: ""; position: absolute; left: 16px; top: 36px;
  bottom: 2px; width: 4px; background: var(--accent); }
.pay .tl li:nth-child(2)::after { background: var(--line); }
.pay .tl li b { font-size: 16px; font-weight: 600; }
.pay .tl li .num { font-size: 14px; font-weight: 600; }
.pay .nopay { display: flex; align-items: center; justify-content: center; gap: 8px;
  font-weight: 600; }
.pay .nopay .ico { width: 16px; height: 16px; background: var(--ink); }
/* pay-exit (#451): the offer card the plans swap to on the first decline — the board's own
   measurements, radii included (16, not --r-card's 12). */
.pay .offer { background: var(--surface); border-radius: 16px; box-shadow: var(--shadow);
  text-align: center; padding: 24px; }
.pay .offer .off { text-transform: uppercase; font-size: 52px; font-weight: 700; letter-spacing: -.03em; line-height: 1; }
.pay .offer .hr { margin: 18px 0 14px; }
.pay .offer .price { display: flex; justify-content: center; align-items: baseline; gap: 12px;
  font-size: 22px; font-weight: 600; }
.pay .offer .price s { color: var(--muted); font-weight: 500; font-size: 18px;
  text-decoration-thickness: 2px; }
.pay .offer .per { margin: 8px 0 0; font-weight: 500; }
`;
