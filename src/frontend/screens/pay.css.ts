// The pay screen's own styles (#263, #3359) — the pay-plans board's .split frame, inside `wmain`.
// The sells-nothing fallback still draws the kit's plan rows (`payPlansEl`).

export const payCss = `
/* The board widens the main like the log's grid does. */
.wmain:has(.pay) { max-width: 1160px; }
.pay { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 0; min-height: 0; }
.pay .hero { min-height: 320px; border-radius: var(--r-card); overflow: hidden; }
.pay .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pay .pane { position: relative; display: flex; flex-direction: column; justify-content: center;
  padding: 0 48px 0 96px; }
.pay .x { position: absolute; right: 16px; top: 4px; }
.pay .pcol { display: flex; flex-direction: column; gap: 12px; max-width: 420px; }
.pay .pcol h1 { margin: 0 0 10px; }
.pay .pcol .cta { margin-top: 10px; }
.pay .pcol .t12 { text-align: center; margin: 0; }
.pay .paylinks a { color: inherit; text-decoration: underline; }
/* A's plan rows (Cal AI 04, ieat-app#3442): Yearly over Monthly — the trial band on top, the check,
   the name with the billed price under it, the per-month figure on the right. */
.pay .pwp2 { display: flex; flex-direction: column; gap: 10px; }
.pay .plan2 { display: flex; flex-direction: column; background: var(--surface); border-radius: 14px;
  box-shadow: 0 0 0 1px var(--line); cursor: pointer; position: relative; overflow: hidden; }
.pay .plan2 input[type=radio] { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
.pay .plan2:has(>input:checked) { box-shadow: 0 0 0 2px var(--ink); }
.pay .plan2:focus-within { box-shadow: 0 0 0 2px var(--ink); }
.pay .plan2 .band { background: var(--hair); color: var(--ink); font-size: 12px; font-weight: 700;
  letter-spacing: .06em; text-align: center; padding: 4px 0; }
.pay .plan2:has(>input:checked) .band { background: var(--ink); color: var(--surface); }
.pay .plan2 .nr { display: flex; align-items: center; gap: 12px; padding: 14px; }
.pay .plan2 .ck { width: 22px; height: 22px; flex: 0 0 22px; border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--line); position: relative; }
.pay .plan2:has(>input:checked) .ck { background: var(--accent); box-shadow: none; }
.pay .plan2:has(>input:checked) .ck::after { content: ""; position: absolute; left: 7px; top: 3px;
  width: 6px; height: 11px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.pay .plan2 .nmc { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.pay .plan2 .nm { font-size: 16px; font-weight: 600; }
.pay .plan2 .billed { font-size: 13px; color: var(--muted); }
.pay .plan2 .pm { font-size: 14px; font-weight: 600; }
.pay .plan2:not(:has(>input:checked)) :is(.nm, .pm) { color: var(--muted); }
/* B · try for free (Cal AI 06): the trial as a timeline, a rail between the dots. */
.pay .tl { list-style: none; margin: 8px 0; padding: 0; display: flex; flex-direction: column; }
.pay .tl li { position: relative; display: flex; flex-direction: column; gap: 2px; padding: 0 0 22px 50px; min-height: 36px; }
.pay .tl li::before { content: ""; position: absolute; left: 0; top: 0; width: 36px; height: 36px;
  border-radius: 50%; background: var(--accent); }
.pay .tl li:not(:last-child)::after { content: ""; position: absolute; left: 16px; top: 36px; bottom: 0;
  width: 4px; background: var(--accent); }
.pay .tl li:nth-child(2)::after { background: var(--line); }
.pay .nopay { margin: 0; text-align: center; font-weight: 600; }
.pay .pcol p.sub { margin: -6px 0 6px; }
/* pay-exit (#451): the offer card the plans swap to on the first decline — the board's own
   measurements, radii included (16, not --r-card's 12). */
.pay .pcol h1.d28 { margin: 0 0 6px; }
.pay .offer { background: var(--surface); border-radius: 16px; box-shadow: var(--shadow);
  text-align: center; padding: 24px; }
.pay .offer .off { font-size: 52px; font-weight: 700; letter-spacing: -.03em; line-height: 1; }
.pay .offer .hr { margin: 18px 0 14px; }
.pay .offer .price { display: flex; justify-content: center; align-items: baseline; gap: 12px;
  font-size: 22px; font-weight: 600; }
.pay .offer .price s { color: var(--muted); font-weight: 500; font-size: 18px;
  text-decoration-thickness: 2px; }
.pay .offer .per { margin: 8px 0 0; font-weight: 500; }
@media (max-width: 960px) {
  .pay .pane { padding: 0 24px; }
}
@media (max-width: 760px) {
  /* One column under the board's split — the plate shrinks to a banner over the pane, the same
     give-it-up the phone's 120 pt floor takes. The × leaves the overlay it sits in at split
     widths and joins the column instead, or it covers the headline. */
  .pay { grid-template-columns: 1fr; }
  .pay .hero { min-height: 0; height: 160px; }
  .pay .pane { padding: 20px 0; }
  .pay .x { position: static; align-self: flex-end; }
  .pay .pcol { max-width: none; }
}
`;
