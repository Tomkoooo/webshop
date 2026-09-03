# Export SAKKMED as a standalone Next.js package

For agents and operators: produce a **portable folder** that contains the live CMS content, media binaries, and the Stagecraft template source — so another AI or a plain Next app can reuse the **real** page instead of reconstructing it.

## Output path (copy-paste)

```text
/Users/tomko/programing/webshop-engine/exports/sakkmed-standalone
```

Relative to repo root: `exports/sakkmed-standalone/`

That directory is **gitignored** (`/exports/` in `.gitignore`). Re-run the export whenever content or UI changes.

## How to export

From the monorepo root:

```bash
npm run export:sakkmed
```

Equivalent:

```bash
node scripts/export/sakkmed-standalone.mjs
```

### Database URL

The script loads repo `.env` and uses:

1. `EXPORT_DB_URL` (optional override), else  
2. `DATABASE_URL`

It does **not** use `SEED_DB_URL` (that often points at another customer DB).

For local SAKKMED, `.env` should have e.g.:

```env
DATABASE_URL=mongodb://192.168.0.12:27017/sakkmed_dev
```

Confirm the log line `Connecting …/sakkmed_dev` before trusting the dump.

## What gets written

| Path | Contents |
| --- | --- |
| `content/home.json` | Published homepage snapshot (`page:home`) |
| `content/pages/<slug>.json` | Static service/project pages |
| `content/branding.json` | Brand name + logos |
| `content/theme.json` | Theme tokens |
| `content/footer.json` | Footer settings (if present) |
| `content/index.json` | Export metadata + AI instructions |
| `public/media/` | DB media files (`/api/media/…` rewritten to `/media/…`) |
| `public/sakkmed/` | Static fallbacks from `apps/sakkmed/public/sakkmed` |
| `source/` | Exact copy of `packages/templates/sakkmed` |
| `app/`, `components/` | Minimal runnable Next homepage |
| `AGENTS.md`, `README.md` | Instructions inside the export |

## Run the exported app

```bash
cd exports/sakkmed-standalone
npm install
npm run dev
```

Open http://localhost:3000

## Hand off to another agent (Claude Code, Cursor, …)

Paste this path and instruction:

```text
Work in /Users/tomko/programing/webshop-engine/exports/sakkmed-standalone

Read AGENTS.md and content/index.json first.
Do NOT redesign or invent copy.
UI source of truth: source/
Content source of truth: content/
Media: public/media/
```

## Re-export after CMS or template edits

1. Publish CMS changes (or ensure `page:*` docs in Mongo are current).  
2. Edit template under `packages/templates/sakkmed` if UI changed.  
3. Run `npm run export:sakkmed` again (overwrites `exports/sakkmed-standalone`).

## Script location

[`scripts/export/sakkmed-standalone.mjs`](../../scripts/export/sakkmed-standalone.mjs)
