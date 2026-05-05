# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture overview

Open Design is a local-first design tool that delegates to your existing coding-agent CLIs. The daemon (Express + SQLite) spawns CLIs in project folders, streams SSE to the web frontend (Next.js 16 + React 18), and renders artifacts in sandboxed iframes.

**Key layers:**
- `apps/daemon` — local privileged daemon, `/api/*` routes, agent spawning, skills, design systems
- `apps/web` — Next.js App Router frontend, prompt composition, artifact parsing
- `apps/desktop` — Electron shell, discovers web URL via sidecar IPC
- `packages/contracts` — shared web/daemon DTOs (pure TypeScript, no framework deps)
- `packages/sidecar-proto` / `sidecar` / `platform` — sidecar process protocol and runtime primitives
- `tools/dev` — local development lifecycle control plane (`pnpm tools-dev`)

**Data flow:** Browser → `/api/*` rewrites → daemon → `child_process.spawn(cli, [...], { cwd: .od/projects/<id> })` → CLI reads `SKILL.md` + `DESIGN.md` → writes artifacts to disk → daemon serves preview.

## Essential commands

```bash
# Development lifecycle (primary entry point)
pnpm tools-dev                    # start daemon + web
pnpm tools-dev run web            # foreground mode
pnpm tools-dev stop               # stop all sidecars
pnpm tools-dev status --json      # check running processes
pnpm tools-dev logs --json        # view logs
pnpm tools-dev check              # diagnostics

# Type checking and testing
pnpm typecheck                    # all packages
pnpm test                         # all tests
pnpm build                        # build all packages
pnpm check:residual-js            # verify no new .js files

# Per-package (examples)
pnpm --filter @open-design/web typecheck
pnpm --filter @open-design/daemon test
pnpm --filter @open-design/contracts typecheck
```

**Important:** There is no `pnpm dev` — all local lifecycle goes through `pnpm tools-dev`.

## Key files to understand

- `apps/daemon/src/agents.ts` — CLI adapter definitions and streaming parsers
- `apps/web/src/prompts/system.ts` — prompt composition (skill + design system + metadata)
- `apps/web/src/prompts/discovery.ts` — question form, brand-spec protocol, 5-dim critique
- `apps/web/src/artifacts/parser.ts` — streaming `<artifact>` HTML parser
- `packages/contracts/` — shared DTOs between web and daemon
- `skills/*/SKILL.md` — skill definitions with `od:` frontmatter
- `design-systems/*/DESIGN.md` — brand design systems (9-section schema)

## Development rules

- **TypeScript-first:** Source edits belong in `.ts` files; `dist/*.js` is generated output
- **No root lifecycle aliases:** Don't add `pnpm dev`, `pnpm start`, etc.
- **Boundary constraints:** App logic must not know about sidecar concepts; keep sidecar awareness in `apps/<app>/sidecar`
- **Contracts purity:** `packages/contracts` must not depend on Next.js, Express, Node fs/process, browser APIs, SQLite, or daemon internals
- **Git commits:** No `Co-authored-by` trailers or co-author metadata

## Validation before submitting

After changes, run at least: `pnpm typecheck && pnpm test`

For build-boundary changes also run: `pnpm build`

For workspace/manifest changes: `pnpm install` first

## Skills and design systems

- Skills live in `skills/` — each is a folder with `SKILL.md` + optional `assets/` + `references/`
- Design systems live in `design-systems/` — each is a `DESIGN.md` with 9-section schema
- The daemon parses `SKILL.md` `od:` frontmatter (mode, platform, scenario, etc.)
- Skills are file-based, not plugins — drop a folder, restart daemon, it appears in picker

## Testing

- `pnpm test` runs all tests
- `pnpm test:ui` / `pnpm test:ui:headed` for Vitest UI
- `pnpm test:e2e:live` for Playwright against live server
- Daemon tests: `pnpm --filter @open-design/daemon test`
- Package tests: `pnpm --filter @open-design/<package> test`

---

For full directory guide, workflow details, and FAQ, see [AGENTS.md](AGENTS.md).
