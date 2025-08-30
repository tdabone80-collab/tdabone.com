/* Helper to manage admin whitelist configuration.
   - Canonicalizes emails to lowercase.
   - Emits a one-time startup warning if no whitelist is configured (when DEBUG is enabled).
*/

const raw = process.env.ADMIN_WHITELIST ?? process.env.SCAN_WHITELIST ?? ''
const list = String(raw)
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

// One-time visible startup warning if no whitelist configured (guarded by DEBUG env)
if (list.length === 0 && ((process.env.DEBUG_WHOAMI === 'true') || (process.env.DEBUG === 'true'))) {
  console.warn('adminConfig: no ADMIN_WHITELIST or SCAN_WHITELIST configured — admin access will be denied by default')
}

export function getAdminWhitelist(): string[] {
  return list
}

export function hasAdminWhitelist(): boolean {
  return list.length > 0
}
