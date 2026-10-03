# Resolution Creator

A guided drafting tool for Indian corporate board/shareholder resolutions and Certified True
Copies. Sibling project to `template` (Finace India) — **same backend** (Directus, Firebase Auth,
Razorpay), **new frontend** (Nuxt 3 + Tailwind, distinct visual identity), and a fundamentally
different document-creation flow: complete one logical section at a time (not one field, not
the whole form), with an AI assistant alongside, validated for compliance *before* generating
the document once, at the end — never a live-editing split screen.

## How this differs from `template`

| | `template` | `resolution-creator` |
|---|---|---|
| Scope | Full document catalog (agreements, forms, resolutions, …) | Board/shareholder resolutions + CTCs only |
| Editing flow | Fill a form, watch a live preview update as you type | Complete one section (a few related fields) at a time; nothing generates until the end |
| Validation | None beyond required-field checks | Input, business, and compliance-rule layers (Companies Act citations) before generation |
| AI | None | Extracts fields from free text, answers section-scoped questions, narrates compliance issues, offers opt-in wording refinement — every AI action shows what it did and lets you undo it |
| Backend | Directus + Firebase + Razorpay | **Same** Directus instance, Firebase project, Razorpay account |
| Output | One document | Notice of Meeting + Resolution + Minutes Extract + optional CTC, generated together from one answer set |

## UX structure

Pages: `/` (compact marketing landing), `/library` (search + category-filtered browsing —
the actual discovery surface), `/create` (category-first picker, an alternate entry into
`/library`), `/r/[slug]` (the resolution flow), `/dashboard` ("My Resolutions" — continue a
draft, or open something already saved).

`/r/[slug]` runs through five phases: **Overview** (two-column: breadcrumb/description/what-
you'll-provide/what-you'll-get on the left, a compact info panel + document preview on the
right; a prominent "Continue your draft" panel replaces the plain overview when one exists) →
**Guided Questions** — no longer one field per screen. Each `section` in the question schema
(Company details, Meeting details, Bank account details, …) renders as ONE screen with all its
fields together (`WizardFieldInput.vue`), validated as a group on "Continue to next section".
Three columns on desktop: a 240px `WizardSectionNav.vue` (done/current/upcoming, per-section
"x/y complete", freely clickable) on the left, the section form in the middle, and a 320px
`WizardAiAssistantPanel.vue` on the right — collapsible to a toggle on mobile. Progress is
field-based (required-and-currently-visible fields answered ÷ total), not screen-count based,
so it stays accurate as conditional fields appear/disappear. → **Review**
(grouped answer summary by section with per-section Edit links, document-option cards for
Notice/CTC/Letterhead, then an inline **Compliance Review** — Pass/Review/Information severity
cards with a summary count, via `ComplianceSummary.vue` — before the Generate action unlocks) →
a brief **Generating** transition → **Resolution Workspace** (the generated document is the
primary object; a white `ResolutionSidebar.vue` info panel sits beside it, not a decorative
card). A `WizardStepTracker.vue` (Choose → Details → Review → Generate) stays visible above all
but the Overview screen.

Editing after generation reopens a compact all-fields modal (`EditAnswersModal.vue`) rather than
replaying the wizard — it still routes back through Review/Compliance before regenerating, since
that's a safety property, not busywork. "Refine wording" opens `RefineWordingModal.vue` (style
presets + optional custom instruction) rather than firing blind. Drafts autosave per resolution
and surface on the dashboard's "Continue where you left off" section (`useDrafts.js` scans
`localStorage` for them).

## Visual identity

Deliberately built from `template`'s own recipe, not a fresh palette: indigo-950 (brand/headings/
primary buttons — Tailwind's default `indigo` scale, the same one `template` uses), orange-500
(accent/CTA — Tailwind's default `orange`), white surfaces, gray neutrals. Poppins for body text
(same family as `template`); Source Serif 4 for headings is the one deliberate departure, since this
reads as a certificate/legal-document tool rather than another SaaS form. The `ink` Tailwind token
carries this: `ink-50..800` are true gray, `ink-900/950` step up into indigo.

The navbar/footer logo, the auth modal's branding-panel image, and the homepage hero illustration
(`public/brand/*.png`) are copied directly from `template`'s own asset folder, not recreated.

## Feature research

Before extending the feature set, I looked at how existing Indian board-resolution generators and
general contract-automation tools are actually built (see chat for full sources — notably
[PracticeFlow's board resolution generator](https://practiceflow.in/tools/board-resolution-generator),
a direct Indian competitor in this exact space). Findings and what they changed here:

- **Three synchronized outputs per resolution** (Notice of Meeting → Resolution → Certified True
  Copy) is the standard shape competing tools ship, not just a resolution + optional CTC. **Implemented**
  — `knowledge/notice-template.json` + a "Minutes Extract" promoted to its own labeled section, all
  rendered from the same answer set, no extra typing. Board-meeting resolutions only (general-meeting
  notices have different Section 101 requirements, out of scope for now).
- **Version control, audit trails, and workflow-routed e-signatures** are the headline UX features of
  general contract-automation tools (PandaDoc, DocuSign CLM). **Not implemented** — no e-signature
  provider is wired up, and "who changed what" tracking implies persistent per-document storage this
  product doesn't have yet. Flagging for evaluation rather than building speculatively.
- **No AI or collaborative editing in any competitor found** (including PracticeFlow) — this product's
  AI-assisted question flow and compliance narration is a genuine differentiator, not table stakes.
- **Draft autosave/resume** — not from external research, but from `template` itself (its own
  `PartialFilledModal` pattern). **Implemented** — the wizard now autosaves in-progress answers to
  `localStorage` per resolution and offers "Continue draft" on return, matching `template`'s existing UX.
- **Print-ready view** — implemented as a `window.print()` path with dedicated print CSS, alongside the
  existing PDF/Word downloads, since "better preview" was explicitly asked for.

## Architecture

Everything resolution-specific — questions, validation rules, compliance rules, template text — is
data in [`knowledge/`](knowledge), never hardcoded into a route. Adding a new resolution type means
adding a JSON file, not writing a new code path. See `server/utils/knowledge.js` for the loader;
swapping it for a Directus-backed version later (to manage the catalog outside of git) only means
changing that one file.

```
knowledge/
  resolutions/*.json     One file per resolution: questions, template, compliance rule IDs, help text
  compliance-rules.json  The shared Companies Act rule pack (RULE-BM-01..06)
  ctc-template.json      Certified True Copy wrapper
  letterhead-template.json
  notice-template.json   Notice of Meeting (board resolutions only)

server/
  utils/
    knowledge.js          Data access (search, get-by-slug, rule lookup)
    validators.js          Input-layer format checks (DIN, CIN, email, phone, PAN)
    complianceEngine.js    Business + Compliance layers — trigger LOGIC only; rule TEXT stays in knowledge/
    templateEngine.js      Handlebars rendering (HTML-escaped for the browser/PDF, plain for DOCX)
    resolutionBrief.js     Builds the post-generation Resolution Brief
    anthropic.js           Claude wrapper — every caller has a deterministic non-AI fallback
  api/
    resolutions/           search, [slug] (questionnaire), validate, generate, download-docx, save-history
    ai/                    next-question, compliance-narrate, refine-draft
    (+ send-otp, verify-otp, admin-reset, create-order, verify-payment, credits — ported from `template`)
```

Frontend: `pages/r/[slug].vue` is the whole wizard — intro → one-question-at-a-time → finishing
touches (CTC/letterhead + compliance check) → generated document. `composables/useKnownFacts.js`
implements the "Minimum Typing" smart-default rule: once you answer `company_name` for one
resolution, every other resolution in the same browser session prefills it.

## Setup

```bash
npm install
cp .env.example .env
npm run dev              # http://localhost:3000 (template runs on :3000 too — don't run both at once
                          # without changing one's port, e.g. `nuxt dev --port 3100`)
```

The `.env.example` file distinguishes two kinds of values:
- **Already filled in** (Firebase web config in `utils/firebase.js`, Directus URLs) — these
  intentionally point at the *same* `finaceindia-1d8d3` / Directus instance as `template`. Leave them.
- **Blank** — real secrets only you have (SMTP, Razorpay, `FIREBASE_SERVICE_ACCOUNT`,
  `DIRECTUS_API_TOKEN`, `ANTHROPIC_API_KEY`). Fill these in from the same places `template` gets them.

### Running without any secrets filled in

The app is designed to degrade gracefully:
- **No `ANTHROPIC_API_KEY`** → the wizard still works; questions show their plain static label
  instead of an AI-phrased one, compliance issues show their own written message instead of an
  AI narration, and the "Refine wording with AI" button reports it isn't configured. Document
  generation (the deterministic Handlebars render) is never AI-dependent — it's correct either way.
- **No `RAZORPAY_*`** → Buy Credits shows "payments are currently switched off"; everything else works.
- **No `SMTP_*` / `FIREBASE_SERVICE_ACCOUNT`** → signup/login by email+OTP and password reset won't
  send mail; Google sign-in still works since it doesn't need SMTP.
- Directus/Firebase reads (browsing the catalog, credits, history) work immediately because those
  endpoints are shared with `template` and already public.

## The knowledge base today

Six worked resolution types ship as the initial demo catalog, spanning Board Resolutions, an
Ordinary Resolution, notice-period/quorum/interested-director compliance rules, and DIN/CIN format
validation: Open a Bank Account, Change Bank Signatories, Appoint an Additional Director, Appoint a
Managing Director, Approve a Related-Party Transaction, and Appoint a Director Retiring by Rotation
(AGM). Add more by dropping a new file in `knowledge/resolutions/` and registering it in
`server/utils/knowledge.js`.

**Licensing note:** the catalog taxonomy and rule citations are adapted from ICSI study material and
CimplyFive's model-resolutions book as *drafting patterns*, not copied verbatim — see the
`resolution-creator` skill's source notes before adding more content sourced the same way. Every
generated document is explicitly a draft for professional review, never a filed document.

## What's not built yet

- Directus collections for the knowledge base itself (`resolutions`, `questions`, `compliance_rules`,
  …) — the PRD calls for these so non-engineers can add resolution types without a deploy. The
  current `knowledge/*.json` loader is a drop-in placeholder with the same exported shape; swapping
  it for Directus-backed calls is the natural next step once that's wanted.
- MCA Master Data import (`POST /import/mca` in the original API surface).
- Bulk/collaborative editing, version history — out of scope for this product (see the "no
  live-preview" design decision) but flagged here in case that assumption ever changes.
