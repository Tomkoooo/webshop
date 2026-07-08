# Documentation index

Markdown guides are grouped by topic. **Vendor PDFs** (GLS API references) live under `reference/vendor/` and are optional reading for shipping integrations.

## Deployment & hosting

| Document | Summary |
| --- | --- |
| [deployment/AI_AGENTS_DEPLOYMENT_GUIDE.md](deployment/AI_AGENTS_DEPLOYMENT_GUIDE.md) | **Agents:** `DEPLOYMENT_KEY`, deployment matrix, template/plugin access |
| [deployment/FORK_DEPLOYMENT_ENGINE.md](deployment/FORK_DEPLOYMENT_ENGINE.md) | Fork-and-deploy workflow and engine expectations |
| [deployment/VERCEL_CUSTOM_DOMAIN_DEPLOYMENT.md](deployment/VERCEL_CUSTOM_DOMAIN_DEPLOYMENT.md) | Vercel deploy + custom domains |
| [deployment/PORTABILITY.md](deployment/PORTABILITY.md) | Portability across environments |

## Plugins

| Document | Summary |
| --- | --- |
| [plugins/PLUGINS.md](plugins/PLUGINS.md) | Plugin system overview |
| [plugins/AI_AGENTS_PLUGIN_GUIDE.md](plugins/AI_AGENTS_PLUGIN_GUIDE.md) | **Agents:** add/register/enable plugins |
| [plugins/T_BOOK.md](plugins/T_BOOK.md) | tBook event + lodging booking plugin (admin, API, pricing engine) |

## Authentication

| Document | Summary |
| --- | --- |
| [auth/GOOGLE_OAUTH_SETUP.md](auth/GOOGLE_OAUTH_SETUP.md) | Google OAuth / Auth.js setup |
| [auth/AUTH_PKCE_VERIFICATION.md](auth/AUTH_PKCE_VERIFICATION.md) | PKCE / callback smoke checks after OAuth changes |

## Integrations

| Document | Summary |
| --- | --- |
| [integrations/STRIPE_WEBHOOK_SETUP.md](integrations/STRIPE_WEBHOOK_SETUP.md) | Stripe webhook endpoint, events, API version |
| [integrations/szamlazzhu-integration.md](integrations/szamlazzhu-integration.md) | Számlázz.hu invoicing |
| [integrations/analytics-gtm-meta.md](integrations/analytics-gtm-meta.md) | GTM, GA4 dataLayer events, Meta Pixel, cookie consent |

## Templates & agents

| Document | Summary |
| --- | --- |
| [templates/CREATING_A_TEMPLATE.md](templates/CREATING_A_TEMPLATE.md) | Full template module specification |
| [templates/AI_AGENTS_TEMPLATE_GUIDE.md](templates/AI_AGENTS_TEMPLATE_GUIDE.md) | Short LLM-oriented template checklist (see deployment guide for `allowedTemplates`) |
| [templates/MULTI_CUSTOMER_TEMPLATES_AND_DEPLOYS.md](templates/MULTI_CUSTOMER_TEMPLATES_AND_DEPLOYS.md) | Many customers, per-customer templates, redeploy isolation, sharing options |

## CMS & content

| Document | Summary |
| --- | --- |
| [admin-user-guide/README.md](admin-user-guide/README.md) | **End users:** in-admin Súgó at `/admin/sugo` (deployment-filtered) |
| [cms/HOMEPAGE_BLOCKS_CMS_ARCHITECTURE.md](cms/HOMEPAGE_BLOCKS_CMS_ARCHITECTURE.md) | Homepage block editor, data model, rendering |
| [cms/legacy-shop-content-field-inventory.md](cms/legacy-shop-content-field-inventory.md) | Legacy flat `ShopContent` keys (MongoDB); not the live homepage contract |

## Reference (binaries)

| Path | Summary |
| --- | --- |
| [reference/vendor/GLS_Map_widget_2025-09-12.pdf](reference/vendor/GLS_Map_widget_2025-09-12.pdf) | GLS map widget (vendor PDF) |
| [reference/vendor/MyGLS_API.pdf](reference/vendor/MyGLS_API.pdf) | MyGLS API (vendor PDF) |
