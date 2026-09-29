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
npm run check:agent-contracts
npm test
npm run typecheck
npm run lint -- --no-fix
npm run build
npm run test:e2e -- --headed
```

`npm test` must discover tests; zero tests is failure. `npm run check:agent-contracts -- --probe-violation` demonstrates rejection of a component importing `setReaction` directly. Playwright uses an API fixture; it proves browser UI/routing behavior within that scope. Its `playwright.config.js` starts port 5050 and reuses an existing local server outside CI; inspect port ownership before interpreting a pass. Run headed in the caller's visible cmux helper terminal, with logs available there.

## Real Spring/H2 flow

Follow the backend `.agents/skills/verify-demp/SKILL.md` for isolated server startup and the same-workspace cmux browser. `npm run dev -- --host 127.0.0.1 --port 5051` uses Vite; set `DEV_API_TARGET=http://127.0.0.1:18081`. Use browser clicks and reload at `/questions/-1` to check persisted votes. Do not label this manual real-server route as Playwright. Keep the E2E pane visible, record actual DOM states and server/version identity, and stop only processes created for this run.
