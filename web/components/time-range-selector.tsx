"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock } from "lucide-react"
import type { TimeRange, TimeRangePreset } from "@/lib/types"
import { timeRangePresets, getTimeRangeFromPreset, formatTimeRange } from "@/lib/time-utils"

interface TimeRangeSelectorProps {
  timeRange: TimeRange
  onChange: (timeRange: TimeRange) => void
  className?: string
}

export default function TimeRangeSelector({ timeRange, onChange, className = "" }: TimeRangeSelectorProps) {
  const [customStartDate, setCustomStartDate] = useState("")
  const [customStartTime, setCustomStartTime] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [customEndTime, setCustomEndTime] = useState("")

  const handlePresetChange = (preset: TimeRangePreset) => {
    if (preset === "custom") {
      onChange({ preset: "custom" })
    } else {
      const newTimeRange = getTimeRangeFromPreset(preset)
      onChange(newTimeRange)
    }
  }

  const handleCustomTimeChange = () => {
    if (customStartDate && customStartTime && customEndDate && customEndTime) {
      const startTime = new Date(`${customStartDate}T${customStartTime}`).getTime()
      const endTime = new Date(`${customEndDate}T${customEndTime}`).getTime()

      if (startTime < endTime) {
        onChange({
          preset: "custom",
          startTime,
          endTime,
        })
      }
    }
  }

  // Initialize custom date/time inputs when switching to custom
  const initializeCustomInputs = () => {
    if (timeRange.startTime && timeRange.endTime) {
      const startDate = new Date(timeRange.startTime)
      const endDate = new Date(timeRange.endTime)

      setCustomStartDate(startDate.toISOString().split("T")[0])
      setCustomStartTime(startDate.toTimeString().slice(0, 5))
      setCustomEndDate(endDate.toISOString().split("T")[0])
      setCustomEndTime(endDate.toTimeString().slice(0, 5))
    } else {
      // Default to last hour
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      setCustomStartDate(oneHourAgo.toISOString().split("T")[0])
      setCustomStartTime(oneHourAgo.toTimeString().slice(0, 5))
      setCustomEndDate(now.toISOString().split("T")[0])
      setCustomEndTime(now.toTimeString().slice(0, 5))
    }
  }

  return (
    <div className={className}>
      <Label className="text-xs font-medium mb-1.5 block">Time Range</Label>
      <Select
        value={timeRange.preset}
        onValueChange={(value: TimeRangePreset) => {
          handlePresetChange(value)
          if (value === "custom") {
            initializeCustomInputs()
          }
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {timeRangePresets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              <div className="flex items-center gap-2">
                <Clock size={12} />
                {preset.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {timeRange.preset === "custom" && (
        <div className="mt-2 space-y-2">
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Start Time</Label>
            <div className="flex gap-1">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value)
                  setTimeout(handleCustomTimeChange, 0)
                }}
                className="h-7 text-xs"
              />
              <Input
                type="time"
                value={customStartTime}
                onChange={(e) => {
                  setCustomStartTime(e.target.value)
                  setTimeout(handleCustomTimeChange, 0)
                }}
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">End Time</Label>
            <div className="flex gap-1">
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value)
                  setTimeout(handleCustomTimeChange, 0)
                }}
                className="h-7 text-xs"
              />
              <Input
                type="time"
                value={customEndTime}
                onChange={(e) => {
                  setCustomEndTime(e.target.value)
                  setTimeout(handleCustomTimeChange, 0)
                }}
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            <Calendar size={12} className="inline mr-1" />
            {formatTimeRange(timeRange)}
          </div>
        </div>
      )}

      {timeRange.preset !== "custom" && (
        <div className="text-xs text-gray-500 mt-1">
          <Calendar size={12} className="inline mr-1" />
          {formatTimeRange(timeRange)}
        </div>
      )}
    </div>
  )
}
