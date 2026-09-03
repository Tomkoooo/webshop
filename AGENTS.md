# Agent instructions (webshop-engine)

Use these guides when changing templates, plugins, deployments, or CMS content.

| Task | Document |
| --- | --- |
| **Deploy / fork / `DEPLOYMENT_KEY` / access matrix** | [docs/deployment/AI_AGENTS_DEPLOYMENT_GUIDE.md](docs/deployment/AI_AGENTS_DEPLOYMENT_GUIDE.md) |
| **Live deploy inventory (domains, GHCR tags, stacks)** | `deployments.registry.local.md` (gitignored — create locally from team copy) |
| **Portainer stack (tBook sironic + WDF + Sörfeszt)** | [docs/deployment/stacks/tbook-sironic.example.yml](docs/deployment/stacks/tbook-sironic.example.yml) (secrets: gitignored `portainer.stack.yml`) |
| **New or edit layout template** | [docs/templates/AI_AGENTS_TEMPLATE_GUIDE.md](docs/templates/AI_AGENTS_TEMPLATE_GUIDE.md) |
| **New or enable plugin** | [docs/plugins/AI_AGENTS_PLUGIN_GUIDE.md](docs/plugins/AI_AGENTS_PLUGIN_GUIDE.md) (storefront UI: reuse template chrome + `src/lib/plugin-storefront-ui.ts`) |
| **Import customer copy into CMS** | [docs/cms/AGENT_CONTENT_IMPORT.md](docs/cms/AGENT_CONTENT_IMPORT.md) |
| **Export SAKKMED standalone (CMS + media + template)** | [docs/export/SAKKMED_STANDALONE_EXPORT.md](docs/export/SAKKMED_STANDALONE_EXPORT.md) |
| **MongoDB seed scripts (customer DBs)** | [.cursor/rules/safe-database-seeding.mdc](.cursor/rules/safe-database-seeding.mdc) |
| **Minecraft camp reference project** | [docs/projects/MINECRAFT_CAMP.md](docs/projects/MINECRAFT_CAMP.md) |

## Engine v2 layout (monorepo)

The engine is npm-workspace packages consumed by thin per-site apps:

| Piece | Location |
| --- | --- |
| Engine packages | `packages/sdk`, `packages/core`, `packages/admin`, `packages/cms-bridge`, `packages/wse-cli` |
| Templates / plugins | `packages/templates/<id>` (`@wse/template-<id>`), `packages/plugins/<id>` (`@wse/plugin-<id>`) |
| Site apps (one per deployment) | `apps/<site>` — identity baked via `WSE_SITE_CONFIG_JSON` in `next.config.ts`, route stubs from `wse sync` |
| Control plane / landing host | `apps/core-admin`, `apps/landing-runtime` |

Common CLI (`node packages/wse-cli/bin/wse.mjs <cmd>` or npm scripts): `create-template`, `create-site`, `sync`, `validate-template`, `cmsify`.

## In-code registries (must stay in sync)

| Registry | File | Purpose |
| --- | --- | --- |
| Templates in build | `packages/core/src/templates/registry.ts` | All `TemplateModule` ids loadable in this image |
| Plugins in build | `packages/core/src/plugins/registry.ts` | All `PluginModule` ids loadable in this image |
| Per-site identity | `apps/<site>/next.config.ts` (`WSE_SITE_CONFIG_JSON`) + `apps/<site>/wse.config.json` | Template, plugins, and routes for that site app |
| Legacy matrix (reference app fallback only) | `deployments.config.json` + `packages/core/src/config/deployments-registry.ts` | Deprecated; site apps bake their own config |

After editing the legacy matrix or either registry, run:

```bash
npm run deployments:validate
```

Human-oriented index: [docs/README.md](docs/README.md).
