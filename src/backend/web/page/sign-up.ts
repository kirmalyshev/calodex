import { signupCopyFor, type OnboardingSignupContent } from "@eait/shared";
import type { Lang } from "@eait/shared";
import { brandSvg } from "@eait/shared/ui/icons";
import { pageCopyFor } from "../copy.ts";
import { dash, wtop } from "./board.ts";
import { escape, shell } from "./shell.ts";

/**
 * The sign-up screen (S8, board `cz-19-signup.html`): attach Apple or Google to the session
 * account, or present one that already has an account, which is the same mechanism in the
 * other direction. The email code flow (#569) is the board's third pill; where the instance
 * sends no mail the pill is not drawn, as its routes are 404 there.
 *
 * The pieces (19, ieat-app#2050): the heading — "Save your progress" when the person comes from
 * their plan, the product's promise when they come to sign in — no picture, the provider
 * buttons — Apple in black with its own mark, Google on the surface with the four-colour G —
 * the "by continuing" line under them, and the one consent box, marketing, never pre-ticked.
 *
 * THE PROVIDER BUTTONS ARE SUBMITS OF ONE FORM, not links: the kickoff is a POST now, because it
 * is the consent that makes the kickoff legal — and `terms` rides the form hidden: continuing IS
 * the agreement (ieat-app#2806), so no honest submit can miss it and the kickoff still refuses
 * one crafted without it. `formaction` names the provider so the one form serves them both.
 *
 * No pairing card: the sign-in choice fills the page's one decision.
 */
export interface SignUpView {
  /** `id` picks the provider's mark; `action` is the kickoff POST's formaction. */
  providers: readonly { id: "apple" | "google"; action: string; label: string }[];
  /** The email kickoff's formaction — a POST like the providers', minting the consent cookie. */
  emailAction: string | null;
  error: string | null;
  /** The published terms, or null where the operator published none. */
  termsHref: string | null;
  /** The published privacy policy, or null where no landing is configured to publish one. */
  privacyHref: string | null;
  /** True when the person arrives from their own plan: the heading is "Save your progress" (19). */
  fromPlan: boolean;
  /** The "Save your plan" heading and line, from the onboarding content (ieat-app#2757); null off the plan. */
  signup: OnboardingSignupContent | null;
  lang: Lang;
}

export function signUp(v: SignUpView): string {
  const SIGNUP_COPY = signupCopyFor(v.lang);
  // The consent line names the two documents, and {terms}/{privacy} sit inside the sentence so a
  // translation can put them wherever its grammar needs them. Each links where the operator
  // published it and stays underlined text, as the board draws it, where nothing was published.
  const docLink = (href: string | null, label: string) => href === null
    ? `<u>${escape(label)}</u>`
    : `<a href="${escape(href)}"><u>${escape(label)}</u></a>`;
  const termsLabel = escape(SIGNUP_COPY.termsLabel)
    .replace("{terms}", docLink(v.termsHref, SIGNUP_COPY.termsLink))
    .replace("{privacy}", docLink(v.privacyHref, SIGNUP_COPY.privacyLink));
  const mark = (id: "apple" | "google") => brandSvg(id === "apple" ? "apple" : "google-signin");
  // The third provider the board draws (#569): its kickoff is a POST for the same reason the
  // OAuth ones are — the consent rides the form — and the address comes AFTER it, on the page
  // the POST lands on. A link here reached only the GET, which answers 303 back (ieat-app#3417).
  const email = v.emailAction === null ? ""
    : `  <button class="cta s" type="submit" formaction="${escape(v.emailAction)}"><i class="ico i-mail" aria-hidden="true"></i>${escape(SIGNUP_COPY.continueEmail)}</button>\n`;
  return shell(v.signup ? v.signup.heading : SIGNUP_COPY.signUpHeading, `${wtop()}
<div class="wmain one"><div class="wcol">
<div class="sup">
${v.fromPlan ? dash("signup", v.lang, { href: "/start/plan", label: pageCopyFor(v.lang).back }) : ""}
<h1>${escape(v.signup ? v.signup.heading : SIGNUP_COPY.signUpHeading)}</h1>
${v.signup ? `<p class="sub">${escape(v.signup.line)}</p>` : ""}
${v.error ? `<p class="notice" role="alert">${escape(v.error)}</p>` : ""}
<form id="signup" method="post">
  <input type="hidden" name="terms" value="yes">
${v.providers.map((p) =>
  `  <button class="cta ${p.id === "apple" ? "apple" : "s"}" type="submit" formaction="${escape(p.action)}">${mark(p.id)}${escape(p.label)}</button>`,
).join("\n")}${email}</form>
<div class="consent">
  <p>${termsLabel}</p>
  <label><input type="checkbox" name="marketing" value="yes" form="signup"><span>${escape(SIGNUP_COPY.consentMarketing)}</span></label>
</div>
</div>
</div></div>
`, v.lang, "ob");
}
