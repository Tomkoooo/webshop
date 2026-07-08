# Kerámia shared

Shared components for Kerámia Dental landing templates on deployment **`keramia-dental`**:

- `keramia-fogfeherites` — fogfehérítés (container / subdomain)
- `keramia-implant` — fogpótlás / implantáció (container / subdomain)

Both templates share one MongoDB when `DEPLOYMENT_KEY=keramia-dental`; pin the active template per container with `TEMPLATE_PIN` or `hostTemplateMap` in `deployments.config.json`.

Not a registered template. Use `createKeramiaLandingTemplate()` from `./createKeramiaLandingTemplate.ts`.

Assets: `public/templates/keramia-shared/`.

Reference demos:

- [keramiadental_fogfeherites](https://github.com/davids-src/keramiadental_fogfeherites)
- [keramiadental_fogpotlas_es_implant](https://github.com/davids-src/keramiadental_fogpotlas_es_implant/tree/main/site)
