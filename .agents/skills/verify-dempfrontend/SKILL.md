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

Playwright uses API fixtures and owns fresh preview and development processes on distinct isolated loopback ports. It never reuses an existing server. Run headed visibly in the user's requested current session; when they specify Codex, do not require cmux. Record actual exit code and assertions. CI uses headless `npm run verify` with evidence artifacts. Fixture E2E does not prove backend persistence. Both projects must execute every required flow and attach an empty vue-warnings JSON array; missing evidence or any unexpected Vue warning fails. Unit warnings also fail, including console reactivity warnings. Build always runs vue-tsc first; temporary readonly state writes and wrong Vue props must fail before Vite builds. Negative type fixtures detect weakened compiler contracts.

## Real Spring/H2 flow

Follow the backend `.agents/skills/verify-demp/SKILL.md` for isolated Spring/H2 startup. Record the exact backend version and current source/build identity. Set preview's `DEV_API_TARGET` to that server and Spring's allowed CORS origins to the actual browser origin. After `npm run build`, start `npm run preview -- --host 127.0.0.1 --port <free-port> --strictPort`; Vite preview inherits server.proxy. Use visible browser clicks and reload at `/questions/-1` to check question/answer recommendation, dislike, switch and cancellation; use a fresh HTTP query to confirm final state. Do not call this manual real-server route Playwright. Keep results visible in the requested session, record actual DOM assertions, and stop only owned processes.

For authorized PR/merge tasks, verify main protection and the GitHub Actions `DEMP frontend verify` source, apply native auto-merge to the exact PR head without bypass, and confirm merged SHA plus its main CI. Ordinary check/implementation requests do not grant commit/merge permission.
