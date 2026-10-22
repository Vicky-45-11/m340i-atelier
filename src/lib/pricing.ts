import { CATEGORIES, type Configuration, type CostTier, type OptionKey } from './configuration'

// No accessory prices were verified, so the configurator never shows a rupee
// figure for an option. It shows a relative cost tier instead, clearly labelled
// as illustrative.

export const TIER_LABEL: Record<CostTier, string> = {
  0: 'Included',
  1: '₹',
  2: '₹₹',
  3: '₹₹₹',
}

export function tierOf(cfg: Configuration, key: OptionKey): CostTier {
  for (const c of CATEGORIES)
    for (const g of c.groups)
      if (g.key === key) return (g.options.find((o) => o.id === cfg[key])?.tier ?? 0) as CostTier
  return 0
}

/** Sum of tiers across all upgrades: a rough "how far from stock" score */
export function upgradeScore(cfg: Configuration): number {
  let s = 0
  for (const c of CATEGORIES) for (const g of c.groups) s += tierOf(cfg, g.key)
  return s
}
