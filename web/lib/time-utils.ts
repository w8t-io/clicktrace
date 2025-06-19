import type { TimeRange, TimeRangePreset } from "./types"

export const timeRangePresets: { value: TimeRangePreset; label: string; minutes: number }[] = [
  { value: "5m", label: "Last 5 minutes", minutes: 5 },
  { value: "10m", label: "Last 10 minutes", minutes: 10 },
  { value: "30m", label: "Last 30 minutes", minutes: 30 },
  { value: "1h", label: "Last 1 hour", minutes: 60 },
  { value: "6h", label: "Last 6 hours", minutes: 360 },
  { value: "12h", label: "Last 12 hours", minutes: 720 },
  { value: "24h", label: "Last 24 hours", minutes: 1440 },
  { value: "custom", label: "Custom range", minutes: 0 },
]

export function getTimeRangeFromPreset(preset: TimeRangePreset): TimeRange {
  if (preset === "custom") {
    return { preset: "custom" }
  }

  const presetConfig = timeRangePresets.find((p) => p.value === preset)
  if (!presetConfig) {
    return { preset: "5m" }
  }

  const now = Date.now()
  const startTime = now - presetConfig.minutes * 60 * 1000

  return {
    preset,
    startTime,
    endTime: now,
  }
}

export function formatTimeRange(timeRange: TimeRange): string {
  if (timeRange.preset === "custom") {
    if (timeRange.startTime && timeRange.endTime) {
      const start = new Date(timeRange.startTime).toLocaleString()
      const end = new Date(timeRange.endTime).toLocaleString()
      return `${start} - ${end}`
    }
    return "Custom range (not set)"
  }

  const preset = timeRangePresets.find((p) => p.value === timeRange.preset)
  return preset?.label || "Unknown range"
}

export function isTraceInTimeRange(traceTimestamp: number, timeRange: TimeRange): boolean {
  if (timeRange.preset === "custom") {
    if (!timeRange.startTime || !timeRange.endTime) {
      return true // If custom range is not fully set, don't filter
    }
    // Convert trace timestamp from microseconds to milliseconds
    const traceTime = traceTimestamp / 1000
    return traceTime >= timeRange.startTime && traceTime <= timeRange.endTime
  }

  // For preset ranges, calculate the range
  const actualRange = getTimeRangeFromPreset(timeRange.preset)
  if (!actualRange.startTime || !actualRange.endTime) {
    return true
  }

  // Convert trace timestamp from microseconds to milliseconds
  const traceTime = traceTimestamp / 1000
  return traceTime >= actualRange.startTime && traceTime <= actualRange.endTime
}
