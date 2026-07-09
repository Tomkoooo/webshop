import {
  adminTokensToCssVars,
  DEFAULT_ADMIN_LAYOUT,
  DEFAULT_ADMIN_TOKENS,
} from "@wse/sdk/admin"

/** Default admin chrome CSS variables for `.admin-shell`. */
export function getDefaultAdminCssVars(): Record<string, string> {
  return adminTokensToCssVars(DEFAULT_ADMIN_TOKENS, DEFAULT_ADMIN_LAYOUT)
}

export { adminTokensToCssVars, DEFAULT_ADMIN_TOKENS, DEFAULT_ADMIN_LAYOUT }
