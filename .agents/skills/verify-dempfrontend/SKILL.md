---
name: verify-dempfrontend
description: Verify DEMP Vue reaction flow, official documentation versions, and visible headed E2E.
---

# Verify DEMP frontend

Read [feature map](../../../docs/engineering/feature-map.md), [architecture](../../../docs/engineering/architecture.md), [official docs](../../../docs/engineering/official-docs.md), and this repository's `AGENTS.md`. The backend is a separate Git repository with its own verification skill.

## Doctor and automated checks

```sh
git status --short
git rev-parse HEAD
asdf exec node --version
npm ci
npx playwright install chromium
npm run verify -- --headed
```

Read [CI and delivery](../../../docs/engineering/ci-and-delivery.md). The common verifier runs AST boundaries/probe, vue-tsc, all Vitest tests, lint, build and development/production Playwright in order. Read `.verification/summary.json`, step logs, unit/e2e JSON and failure traces. Missing required files/assertions/flows, zero tests, skip, retries, failed assertions or changing source/build fail verification. The manifest is a reviewable minimum contract, not a fixed test count or proof of complete requirements. Demonstrate a real temporary forbidden import is rejected; do not just report the probe implementation as evidence.

Playwright uses API fixtures and owns fresh preview and development processes on distinct isolated loopback ports. It never reuses an existing server. Follow `AGENTS.md` and the user's current browser constraint for local execution. If the user excludes Chrome for Testing, run local non-browser checks and actual cmux/Spring flows; retain Playwright assertions for CI and report fixture browser execution as pending. Do not claim cmux replaces the fixture suite. Record actual exit code and assertions. CI uses headless `npm run verify` with evidence artifacts. Fixture E2E does not prove backend persistence. Both projects must execute every required flow and attach an empty vue-warnings JSON array; missing evidence or any unexpected Vue warning fails. Unit warnings also fail, including console reactivity warnings. Build always runs vue-tsc first; temporary readonly state writes and wrong Vue props must fail before Vite builds. Negative type fixtures detect weakened compiler contracts.

## Real Spring/H2 flow

Follow the backend `.agents/skills/verify-demp/SKILL.md` for isolated Spring/H2 startup. Record the exact backend version and current source/build identity. Set preview's `DEV_API_TARGET` to that server and Spring's allowed CORS origins to the actual browser origin. After `npm run build`, start `npm run preview -- --host 127.0.0.1 --port <free-port> --strictPort`; Vite preview inherits server.proxy. Use visible browser clicks and reload at `/questions/-1` to check question/answer recommendation, dislike, switch and cancellation; use a fresh HTTP query to confirm final state. Do not call this manual real-server route Playwright. Keep results visible in the requested session, record actual DOM assertions, and stop only owned processes.

For authorized PR/merge tasks, verify main protection and the GitHub Actions `DEMP frontend verify` source, apply native auto-merge to the exact PR head without bypass, and confirm merged SHA plus its main CI. Ordinary check/implementation requests do not grant commit/merge permission.

## Question editing, tags, and admin footer

For view counts, distinguish `viewQuestion` (detail GET) from editing `getQuestionDetail` (`recordView=false`). In the actual cmux/Spring browser, enter detail, reload, return to list, then open editing without saving: successful detail requests add one, editing/list do not. Confirm committed hits through a fresh pure API query. Browser fixture counts do not prove storage. Do not open Chrome for Testing locally when the user excludes it; keep fixture tests in CI.

Use actual clicks at `/questions/-1`: add/remove tags, observe duplicate error spacing, click a detail hashtag and clear the visible list condition without losing other query parameters. Check checkbox state after navigation. As the author, edit title/Markdown/tags, save, reload, and confirm question/answer reactions remain. A different author or server 403 must not expose the form; failed saves preserve inputs. Check guest/member footer absence, verified admin presence, logout reset, and delayed old-admin responses in the unit suite. Local fixture coverage, actual server persistence, and pending CI execution must be recorded separately.

## Announcement card density

Use actual cmux/Spring at `/`: company/position precede title, recruitment/employment follow title; preserve technology/date/education. At 320/390/640/768/1024/1440px verify 56×56px thumbnail, company >=16px, position >=13px, >=8px heading/title/audience gaps, natural text wrapping and no horizontal overflow. Click or Enter into detail and return with the query preserved; reload preserves server values. Existing CompanyImage fallback/error and education contracts remain in unit/CI fixtures. Record comparable card heights using the same data/width. [Phase evidence](../../../docs/announcement-card-density.md).

## Announcement search filters

At `/`, open positions then languages: only one `.filter-popover` remains. Search items, select another value and clear item search: hidden previous selections must remain checked and appear in URL/chips. Search title stays a draft until submit; selecting another filter must use the previously applied title. Check status radio, direct career 20 restoration, invalid integer input keeping URL/value, exact quick years, clear career, reload/back and EDU tuition. Career 0 means no condition; it is not new graduate. Groups retain existing OR-within/AND-between server semantics.

Use the actual current cmux/Spring browser. At 320/390/640/768/1024/1440px assert four 44px left aligned triggers, one panel, viewport containment, mobile static panel and no horizontal overflow. Esc closes and returns trigger focus; outside clicks close. Keep `announcement-filters.spec.js` and strengthened responsive assertions in both CI browser projects. See [execution record](../../../docs/announcement-filter-interactions.md) for source/runtime identity and failure/coverage boundaries.

## Announcement employment type and spacing

Employment type is separate from recruitment audience: unknown/null, regular, contract, conversion internship, experiential internship. Check admin save/reload and public list/detail badges together with backend storage/legacy SQL rehearsal. Do not infer regular employment for old rows. Education changes clear employment type. Use full native checkbox labels to select technology, save/reload, and verify retained values. At 320/390/1440px check 40px chip height, 8px gaps, natural wrapping and no horizontal overflow. Load history with several long titles: preserve server order/values and verify date/actor/status above the title, left alignment and at least 8px vertical gap. See [the phase evidence](../../../docs/question-tag-and-account-ui-verification.md) for actual results and runtime identity.
