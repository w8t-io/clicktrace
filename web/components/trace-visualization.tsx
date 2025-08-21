"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronDown, ChevronRight, Clock, AlertCircle, Info, Filter, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDuration, getSpanColor } from "@/lib/utils"
import type { Trace, Span } from "@/lib/types"
import SpanDetail from "./span-detail"
import type { FilterCriteria } from "@/lib/types"

interface TraceVisualizationProps {
  trace: Trace
}

export default function TraceVisualization({ trace }: TraceVisualizationProps) {
  // Choose readable text color based on background
  const getContrastColor = (hexColor: string) => {
    const hex = hexColor.replace("#", "")
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    // Perceived luminance formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 160 ? "#111827" : "#ffffff" // slate-900 or white
  }
  const [expandedSpans, setExpandedSpans] = useState<Set<string>>(new Set([trace.spans[0]?.spanId || ""]))
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterCriteria>({
    services: [],
    operations: [],
    tags: [],
    startTime: null,
    endTime: null,
    limit: 100,
  })

  // Calculate the total duration of the trace
  const startTime = Math.min(...trace.spans.map((span) => span.startTime))
  const endTime = Math.max(...trace.spans.map((span) => span.startTime + span.duration))
  const totalDuration = endTime - startTime

  // Group operations by service
  const operationsByService = useMemo(() => {
    const result: Record<string, string[]> = {}

    trace.spans.forEach((span) => {
      if (!result[span.serviceName]) {
        result[span.serviceName] = []
      }

      if (!result[span.serviceName].includes(span.operationName)) {
        result[span.serviceName].push(span.operationName)
      }
    })

    return result
  }, [trace.spans])

  // Apply filters to spans
  const filteredSpans = useMemo(() => {
    return trace.spans
      .filter((span) => {
        // Filter by service
        if (filters.services.length > 0 && !filters.services.includes(span.serviceName)) {
          return false
        }

        // Filter by operation
        if (filters.operations.length > 0 && !filters.operations.includes(span.operationName)) {
          return false
        }

        // Filter by tags
        if (filters.tags.length > 0) {
          const spanTags = span.tags || []
          const hasMatchingTag = filters.tags.some((filterTag) => {
            return spanTags.some((spanTag) => spanTag.key === filterTag.key && spanTag.value.includes(filterTag.value))
          })
          if (!hasMatchingTag) return false
        }

        // Filter by time range
        if (filters.startTime && span.startTime < filters.startTime) {
          return false
        }
        if (filters.endTime && span.startTime + span.duration > filters.endTime) {
          return false
        }

        return true
      })
      .slice(0, filters.limit)
  }, [trace.spans, filters])

  // Build the span hierarchy with robust root detection
  const spanMap = new Map<string, Span>()
  const childrenMap = new Map<string, Span[]>()
  const spanIdSet = new Set(filteredSpans.map((s) => s.spanId))

  filteredSpans.forEach((span) => {
    spanMap.set(span.spanId, span)

    const parentId = span.parentSpanId && spanIdSet.has(span.parentSpanId) ? span.parentSpanId : "root"
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, [])
    }
    childrenMap.get(parentId)?.push(span)
  })

  // Root spans: parent not present in the set
  const rootSpans = (childrenMap.get("root") || []).slice().sort((a, b) => a.startTime - b.startTime)

  // Auto-expand root spans on first load if nothing expanded
  useEffect(() => {
    if (expandedSpans.size === 0 && rootSpans.length > 0) {
      setExpandedSpans(new Set(rootSpans.map((s) => s.spanId)))
    }
  }, [rootSpans])

  const toggleSpan = (spanId: string) => {
    const newExpandedSpans = new Set(expandedSpans)
    if (newExpandedSpans.has(spanId)) {
      newExpandedSpans.delete(spanId)
    } else {
      newExpandedSpans.add(spanId)
    }
    setExpandedSpans(newExpandedSpans)
  }

  const renderSpan = (span: Span, depth = 0) => {
    const children = childrenMap.get(span.spanId) || []
    const isExpanded = expandedSpans.has(span.spanId)
    const hasChildren = children.length > 0
    const leftOffset = ((span.startTime - startTime) / totalDuration) * 100
    const widthPercentage = (span.duration / totalDuration) * 100
    const isSelected = selectedSpan?.spanId === span.spanId

    return (
      <div key={span.spanId} className="relative">
        <div
          className={`flex items-center py-1.5 hover:bg-gray-50 transition-colors ${
            isSelected ? "bg-blue-50" : ""
          } cursor-pointer`}
          onClick={() => setSelectedSpan(span)}
        >
          <div className="flex items-center" style={{ paddingLeft: `${depth * 16}px` }}>
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSpan(span.spanId)
                }}
                className="mr-1 p-1 rounded hover:bg-gray-200 transition-colors"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            <div className="font-medium text-sm truncate max-w-[180px]" title={span.operationName}>
              {span.operationName}
            </div>
          </div>

          <div className="ml-2 flex items-center gap-2">
            {span.hasError && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle size={14} className="text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This span has errors</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {(() => {
              const color = getSpanColor(span)
              const text = getContrastColor(color)
              return (
                <Badge
                  className="text-xs py-0 h-5 font-medium"
                  style={{ backgroundColor: color, color: text, borderColor: color }}
                >
                  {span.serviceName}
                </Badge>
              )
            })()}
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={12} />
              {formatDuration(span.duration)}
            </div>
          </div>

          <div className="flex-1 relative h-5 ml-4">
            <div
              className="absolute top-1/2 -translate-y-1/2 h-2 rounded"
              style={{
                left: `${leftOffset}%`,
                width: `${Math.max(widthPercentage, 0.5)}%`,
                backgroundColor: getSpanColor(span),
              }}
            />
          </div>
        </div>

        {isExpanded && hasChildren && <div>{children.map((childSpan) => renderSpan(childSpan, depth + 1))}</div>}
      </div>
    )
  }

  // Extract unique services for filters
  const uniqueServices = [...new Set(trace.spans.map((span) => span.serviceName))]

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-sm font-semibold flex items-center">
                  Trace: <span className="font-mono ml-1 text-gray-600">{trace.traceId}</span>
                </h2>
                <div className="text-xs text-gray-500">{new Date(startTime / 1000).toLocaleTimeString()}</div>
              </div>
            </div>

            <div className="border rounded-md border-gray-200">
              <div className="flex items-center p-2 bg-gray-50 border-b text-xs font-medium text-gray-600">
                <div className="w-[220px]">Operation</div>
                <div className="w-[180px]">Service / Duration</div>
                <div className="flex-1">Timeline</div>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="p-1">{rootSpans.map((span) => renderSpan(span))}</div>
                {rootSpans.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                    <Info size={24} className="mb-2" />
                    <p className="text-sm">No spans match the current filters</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-3">
            {selectedSpan ? (
              <SpanDetail span={selectedSpan} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                <Info size={24} className="mb-2" />
                <p className="text-sm">Select a span to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
