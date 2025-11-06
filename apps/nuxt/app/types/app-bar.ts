export type AppBarMenuItem = {
  key: string
  label: string
  icon: string
  action?: () => Promise<void> | void
  to?: string
  dataTestId?: string
  dividerBefore?: boolean
}
