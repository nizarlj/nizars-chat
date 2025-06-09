import { Thread } from "@/hooks/useThreads"
import { TIME_PERIODS } from "./constants"

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000

export const getTimeGroupKey = (thread: Thread): string => {
  if (thread.pinned) return 'pinned'
  
  const now = Date.now()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()
  
  const threadTime = thread.updatedAt
  
  const sortedPeriods = TIME_PERIODS
    .filter(period => period.days !== null)
    .sort((a, b) => (a.days as number) - (b.days as number))
  
  for (const period of sortedPeriods) {
    const daysAgo = period.days as number
    const periodMs = todayMs - (daysAgo * ONE_DAY_IN_MS)
    
    if (threadTime >= periodMs) {
      return period.key
    }
  }
  
  return 'older'
} 