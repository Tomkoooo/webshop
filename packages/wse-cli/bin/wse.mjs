#!/usr/bin/env node
import { runSync } from "../src/sync.mjs"
import { runValidateTemplate } from "../src/validate-template.mjs"
import { runCreateSite } from "../src/create-site.mjs"
import { runCreateTemplate } from "../src/create-template.mjs"
import { runCmsify } from "../src/cmsify.mjs"

const [, , command, ...args] = process.argv

const commands = {
  sync: runSync,
  "validate-template": runValidateTemplate,
  "create-site": runCreateSite,
  "create-template": runCreateTemplate,
  cmsify: runCmsify,
}

const run = commands[command]
if (!run) {
  console.error(
    `Usage: wse <command>\n\nCommands:\n  sync               Regenerate route stubs for a site app (run from the app dir or pass --app <dir>)\n  validate-template  Lint a template package for CMS wiring and theme-token rules\n  create-template    Scaffold a template package in packages/templates/<id> from a base template\n  create-site        Scaffold a new site app in apps/<name>\n  cmsify             Wrap literal JSX text/images in a template with Cms* primitives (report mode)`
  )
  process.exit(command ? 1 : 0)
}

run(args).catch((err) => {
  console.error(err.stack || String(err))
  process.exit(1)
})
