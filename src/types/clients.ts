export interface PermissionCheck {
  feature: string
  check: () => Promise<unknown>
  warningMessage: string
}
