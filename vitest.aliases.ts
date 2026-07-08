import path from "path";

/** Mirrors the @wse/* path aliases from tsconfig.base.json for Vitest. */
export function wseAliases(root: string) {
  const p = (...segments: string[]) => path.resolve(root, ...segments);
  return [
    { find: /^@wse\/sdk$/, replacement: p("packages/sdk/src/index.ts") },
    { find: /^@wse\/sdk\/(.*)$/, replacement: p("packages/sdk/src") + "/$1" },
    { find: /^@wse\/core\/(.*)$/, replacement: p("packages/core/src") + "/$1" },
    { find: /^@wse\/admin\/(.*)$/, replacement: p("packages/admin/src") + "/$1" },
    { find: /^@wse\/ui\/(.*)$/, replacement: p("packages/ui/src") + "/$1" },
    { find: /^@wse\/cms-bridge$/, replacement: p("packages/cms-bridge/src/index.ts") },
    { find: /^@wse\/cms-bridge\/(.*)$/, replacement: p("packages/cms-bridge/src") + "/$1" },
    { find: /^@wse\/template-([^/]+)\/(.*)$/, replacement: p("packages/templates") + "/$1/$2" },
    { find: /^@wse\/plugin-([^/]+)\/(.*)$/, replacement: p("packages/plugins") + "/$1/$2" },
  ];
}
