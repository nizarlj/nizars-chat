export const TIME_PERIODS = [
  { key: 'pinned', label: 'Pinned', days: null },
  { key: 'today', label: 'Today', days: 0 },
  { key: 'yesterday', label: 'Yesterday', days: 1 },
  { key: 'last7Days', label: 'Last 7 Days', days: 7 },
  { key: 'last30Days', label: 'Last 30 Days', days: 30 },
  { key: 'older', label: 'Older', days: null },
] as const

export type TimePeriod = (typeof TIME_PERIODS)[number]