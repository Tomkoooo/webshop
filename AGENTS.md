# Agent instructions (webshop-engine)

Use these guides when changing templates, plugins, deployments, or CMS content.

| Task | Document |
| --- | --- |
| **Deploy / fork / `DEPLOYMENT_KEY` / access matrix** | [docs/deployment/AI_AGENTS_DEPLOYMENT_GUIDE.md](docs/deployment/AI_AGENTS_DEPLOYMENT_GUIDE.md) |
| **New or edit layout template** | [docs/templates/AI_AGENTS_TEMPLATE_GUIDE.md](docs/templates/AI_AGENTS_TEMPLATE_GUIDE.md) |
| **New or enable plugin** | [docs/plugins/AI_AGENTS_PLUGIN_GUIDE.md](docs/plugins/AI_AGENTS_PLUGIN_GUIDE.md) (storefront UI: reuse template chrome + `src/lib/plugin-storefront-ui.ts`) |
| **Import customer copy into CMS** | [docs/cms/AGENT_CONTENT_IMPORT.md](docs/cms/AGENT_CONTENT_IMPORT.md) |
| **MongoDB seed scripts (customer DBs)** | [.cursor/rules/safe-database-seeding.mdc](.cursor/rules/safe-database-seeding.mdc) |
| **Minecraft camp reference project** | [docs/projects/MINECRAFT_CAMP.md](docs/projects/MINECRAFT_CAMP.md) |

## In-code registries (must stay in sync)

| Registry | File | Purpose |
| --- | --- | --- |
| Templates in build | `src/templates/registry.ts` | All `TemplateModule` ids shipped in this image |
| Plugins in build | `src/plugins/registry.ts` | All `PluginModule` ids shipped in this image |
| Per-deployment access | `deployments.config.json` + `src/config/deployments-registry.ts` | Which templates/plugins each `DEPLOYMENT_KEY` may use |

After editing the deployment matrix or either registry, run:

```bash
npm run deployments:validate
```

Human-oriented index: [docs/README.md](docs/README.md).
