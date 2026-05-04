#!/usr/bin/env node
// Seed the running daemon with pre-baked test projects so the UI has
// real slide decks and web prototypes to work with without waiting for
// an LLM run. Pulls each project's content straight from a skill's
// `example.html`, drops it in as `index.html`, and adds a couple of
// fake chat messages so the conversation panel isn't empty.
//
// Usage (daemon must be running — e.g. `pnpm tools-dev`):
//   pnpm seed:test-projects                    # default bundle
//   pnpm seed:test-projects --decks 2 --webs 2 # cap counts
//   pnpm seed:test-projects --daemon http://127.0.0.1:17456
//   pnpm seed:test-projects --clear            # remove previously seeded projects
//
// Seeded project ids start with `seed-` so `--clear` only touches the
// fixtures this script created.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const SEED_PREFIX = 'seed-';

type SeedKind = 'deck' | 'prototype';

interface SeedFixture {
  skillId: string;
  kind: SeedKind;
  name: string;
  pendingPrompt: string;
  // optional: path to the file inside skills/<skillId>/ to load as index.html
  // (defaults to example.html)
  source?: string;
}

const DECKS: SeedFixture[] = [
  {
    skillId: 'html-ppt-pitch-deck',
    kind: 'deck',
    name: 'Pitch deck — Series A',
    pendingPrompt:
      'Make a 10-slide investor pitch deck for an AI design tool. Cover problem, solution, market, traction, ask.',
  },
  {
    skillId: 'kami-deck',
    kind: 'deck',
    name: 'Kami deck — quarterly review',
    pendingPrompt:
      'Build a print-grade kami deck summarizing Q2 results: revenue, top wins, risks, next quarter.',
  },
  {
    skillId: 'html-ppt-weekly-report',
    kind: 'deck',
    name: 'Weekly report — eng team',
    pendingPrompt:
      'Weekly report deck for an engineering team: shipped, in-progress, blockers, next-week plan.',
  },
  {
    skillId: 'html-ppt-product-launch',
    kind: 'deck',
    name: 'Product launch — v2.0',
    pendingPrompt:
      'Product launch deck for v2.0: hero feature, before/after, pricing, rollout plan.',
  },
];

const WEBS: SeedFixture[] = [
  {
    skillId: 'open-design-landing',
    kind: 'prototype',
    name: 'Editorial landing — Atelier Zero',
    pendingPrompt:
      'Single-page editorial landing page for an AI design tool. Magazine collage hero, sticky nav, scroll reveal.',
  },
  {
    skillId: 'kami-landing',
    kind: 'prototype',
    name: 'Kami landing — white paper',
    pendingPrompt:
      'Print-grade kami landing — parchment canvas, ink-blue accent. Treat it like a studio one-pager.',
  },
  {
    skillId: 'dashboard',
    kind: 'prototype',
    name: 'Admin dashboard — analytics',
    pendingPrompt:
      'Admin dashboard with KPI cards, a revenue chart, and a recent activity table. Fixed left sidebar.',
  },
];

interface Args {
  daemonUrl: string;
  decks: number;
  webs: number;
  clear: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    daemonUrl:
      process.env.OD_DAEMON_URL ||
      `http://127.0.0.1:${process.env.OD_PORT || 7456}`,
    decks: DECKS.length,
    webs: WEBS.length,
    clear: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--daemon' || a === '--daemon-url') {
      out.daemonUrl = argv[++i] || out.daemonUrl;
    } else if (a === '--decks') {
      out.decks = Math.max(0, Number(argv[++i]) || 0);
    } else if (a === '--webs' || a === '--prototypes') {
      out.webs = Math.max(0, Number(argv[++i]) || 0);
    } else if (a === '--clear') {
      out.clear = true;
    } else if (a === '-h' || a === '--help') {
      printHelp();
      process.exit(0);
    } else {
      console.error(`unknown flag: ${a}`);
      printHelp();
      process.exit(2);
    }
  }
  return out;
}

function printHelp() {
  console.log(`Usage: pnpm seed:test-projects [opts]

Seeds the running daemon with pre-baked slide decks and web prototypes
loaded from each skill's example.html. Useful for working on the UI
without waiting for an LLM run.

Options:
  --daemon <url>     Daemon base URL (default: $OD_DAEMON_URL or http://127.0.0.1:7456)
  --decks <n>        Number of slide decks to seed (default: ${DECKS.length}, max: ${DECKS.length})
  --webs <n>         Number of web prototypes to seed (default: ${WEBS.length}, max: ${WEBS.length})
  --clear            Delete every previously seeded project (id prefix '${SEED_PREFIX}')
  -h, --help         Show this help

The script picks up OD_DAEMON_URL / OD_PORT from the env that
\`pnpm tools-dev\` exports, so a one-liner works:
  pnpm tools-dev    # in one shell
  pnpm seed:test-projects
`);
}

async function api<T = unknown>(
  daemonUrl: string,
  method: string,
  pathPart: string,
  body?: unknown,
): Promise<T> {
  const url = `${daemonUrl.replace(/\/$/, '')}${pathPart}`;
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  let resp: Response;
  try {
    resp = await fetch(url, init);
  } catch (err) {
    throw new Error(
      `cannot reach daemon at ${daemonUrl} — start it with \`pnpm tools-dev\` ` +
        `(underlying error: ${(err as Error).message || String(err)})`,
    );
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`${method} ${pathPart} → ${resp.status}: ${text}`);
  }
  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

function makeSeedId(skillId: string): string {
  // unique-ish, sortable, easy to spot in the UI / db
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  // Slug must match [A-Za-z0-9._-]{1,128}, see daemon validation.
  const slug = skillId.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 60);
  return `${SEED_PREFIX}${slug}-${ts}-${rand}`.slice(0, 128);
}

async function loadExample(fix: SeedFixture): Promise<string> {
  const file = path.join(SKILLS_DIR, fix.skillId, fix.source ?? 'example.html');
  return readFile(file, 'utf8');
}

async function seedOne(daemonUrl: string, fix: SeedFixture): Promise<void> {
  const html = await loadExample(fix);
  const id = makeSeedId(fix.skillId);
  process.stdout.write(`  - ${fix.kind.padEnd(9)} ${id}  (${fix.skillId})\n`);

  const created = await api<{
    project: { id: string };
    conversationId: string;
  }>(daemonUrl, 'POST', '/api/projects', {
    id,
    name: fix.name,
    skillId: fix.skillId,
    pendingPrompt: fix.pendingPrompt,
    metadata: { kind: fix.kind, seeded: true, source: 'seed-test-projects' },
  });

  await api(daemonUrl, 'POST', `/api/projects/${id}/files`, {
    name: 'index.html',
    content: html,
    encoding: 'utf8',
  });

  await api(daemonUrl, 'PUT', `/api/projects/${id}/tabs`, {
    tabs: ['index.html'],
    active: 'index.html',
  });

  // Fake chat history so the conversation panel isn't empty. Two messages
  // is enough for the recent-activity sort and for the assistant bubble
  // to render with a producedFiles chip.
  const cid = created.conversationId;
  const userMid = `seed-msg-user-${Date.now().toString(36)}`;
  const asstMid = `seed-msg-asst-${Date.now().toString(36)}`;
  const now = Date.now();
  await api(
    daemonUrl,
    'PUT',
    `/api/projects/${id}/conversations/${cid}/messages/${userMid}`,
    {
      role: 'user',
      content: fix.pendingPrompt,
      createdAt: now,
    },
  );
  await api(
    daemonUrl,
    'PUT',
    `/api/projects/${id}/conversations/${cid}/messages/${asstMid}`,
    {
      role: 'assistant',
      content:
        `Seeded \`index.html\` from \`skills/${fix.skillId}/example.html\` ` +
        `as a starting point. Open the preview tab to see the rendered ${fix.kind}.`,
      agentId: 'seed-script',
      agentName: 'seed-test-projects',
      runStatus: 'succeeded',
      startedAt: now,
      endedAt: now,
      producedFiles: ['index.html'],
      createdAt: now,
    },
  );
}

async function clearSeeded(daemonUrl: string): Promise<void> {
  const { projects } = await api<{ projects: Array<{ id: string }> }>(
    daemonUrl,
    'GET',
    '/api/projects',
  );
  const seeded = projects.filter((p) => p.id.startsWith(SEED_PREFIX));
  if (seeded.length === 0) {
    console.log('no seeded projects to remove.');
    return;
  }
  console.log(`removing ${seeded.length} seeded project(s):`);
  for (const p of seeded) {
    process.stdout.write(`  - ${p.id}\n`);
    await api(daemonUrl, 'DELETE', `/api/projects/${p.id}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.clear) {
    await clearSeeded(args.daemonUrl);
    return;
  }

  const decks = DECKS.slice(0, args.decks);
  const webs = WEBS.slice(0, args.webs);
  if (decks.length === 0 && webs.length === 0) {
    console.error('--decks 0 and --webs 0 — nothing to do.');
    process.exit(2);
  }

  console.log(`seeding ${decks.length} deck(s) + ${webs.length} web prototype(s) → ${args.daemonUrl}`);
  const failures: string[] = [];
  for (const fix of [...decks, ...webs]) {
    try {
      await seedOne(args.daemonUrl, fix);
    } catch (err) {
      failures.push(fix.skillId);
      console.error(`  ! ${fix.skillId} failed: ${(err as Error).message}`);
    }
  }
  if (failures.length > 0) {
    console.error(
      `done with ${failures.length} failure(s): ${failures.join(', ')}`,
    );
    process.exit(1);
  }
  console.log('done. Open the web UI — the seeded projects show up in the project list.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
