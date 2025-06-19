"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Combobox } from "@/components/ui/combobox"
import { X, Plus, Filter, RefreshCw } from "lucide-react"
import type { TraceListFilterCriteria, TagOperator } from "@/lib/types"
import TimeRangeSelector from "./time-range-selector"
import { getTimeRangeFromPreset } from "@/lib/time-utils"

interface TraceListFiltersProps {
  services: string[]
  operations: string[]
  serviceOperations: Record<string, string[]>
  filters: TraceListFilterCriteria
  setFilters: (filters: TraceListFilterCriteria) => void
  servicesLoading?: boolean
  operationsLoading?: boolean
  onRefresh?: () => void
}

const tagOperators = [
  { label: "==", value: "==", description: "" },
  { label: "!=", value: "!=", description: "" },
  { label: "=~", value: "=~", description: "" },
  { label: "!~", value: "!~", description: "" },
]

const STORAGE_KEY = "trace-list-filters"

export default function TraceListFilters({
                                           services,
                                           operations,
                                           serviceOperations,
                                           filters,
                                           setFilters,
                                           servicesLoading = false,
                                           operationsLoading = false,
                                           onRefresh,
                                         }: TraceListFiltersProps) {
  const [tagKey, setTagKey] = useState("")
  const [tagOperator, setTagOperator] = useState<TagOperator>("==")
  const [tagValue, setTagValue] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  // Load saved filters from sessionStorage on component mount
  useEffect(() => {
    try {
      const savedFilters = sessionStorage.getItem(STORAGE_KEY)
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters)
        setFilters({
          ...parsedFilters,
          // Ensure timeRange has proper structure
          timeRange: parsedFilters.timeRange || getTimeRangeFromPreset("24h"),
          // Ensure tags is an array
          tags: Array.isArray(parsedFilters.tags) ? parsedFilters.tags : [],
        })
      }
    } catch (error) {
      console.error("Failed to load saved filters:", error)
    }
  }, [setFilters])

  // Save filters to sessionStorage whenever filters change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
    } catch (error) {
      console.error("Failed to save filters:", error)
    }
  }, [filters])

  // Get operations for the selected service with proper fallback
  const filteredOperations = filters.service ? serviceOperations[filters.service] || [] : []

  // Convert services to combobox options
  const serviceOptions = services.map((service) => ({
    value: service,
    label: service,
  }))

  // Convert operations to combobox options
  const operationOptions = filteredOperations.map((operation) => ({
    value: operation,
    label: operation,
  }))

  // Add a handler for service change to reset operation if it's not in the filtered list
  const handleServiceChange = (service: string) => {
    // Get operations for the new service with proper fallback
    const newOperations = service ? serviceOperations[service] || [] : []

    // If the currently selected operation is not in the new service's operations, reset it
    const shouldResetOperation = filters.operation && !newOperations.includes(filters.operation)

    setFilters({
      ...filters,
      service,
      operation: shouldResetOperation ? "" : filters.operation,
    })
  }

  const addTagFilter = () => {
    if (tagKey.trim() && tagValue.trim()) {
      setFilters({
        ...filters,
        tags: [...(filters.tags || []), { key: tagKey.trim(), operator: tagOperator, value: tagValue.trim() }],
      })
      setTagKey("")
      setTagOperator("==")
      setTagValue("")
    }
  }

  const removeTagFilter = (index: number) => {
    const newTags = [...(filters.tags || [])]
    newTags.splice(index, 1)
    setFilters({
      ...filters,
      tags: newTags,
    })
  }

  const resetFilters = () => {
    const defaultFilters = {
      service: "",
      operation: "",
      tags: [],
      timeRange: getTimeRangeFromPreset("24h"),
      limit: 20,
      hasError: false,
    }
    setFilters(defaultFilters)
    // Clear saved filters
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear saved filters:", error)
    }
  }

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }
  }

  const hasActiveFilters =
      filters.service ||
      filters.operation ||
      (filters.tags || []).length > 0 ||
      filters.timeRange.preset !== "24h" ||
      filters.hasError

  return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold flex items-center">
              <Filter size={14} className="mr-1" /> Filters
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw size={12} className={`mr-1 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={resetFilters}>
                    <X size={12} className="mr-1" /> Clear
                  </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {/* Service Filter with Search */}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Service</Label>
              <Combobox
                  options={serviceOptions}
                  value={filters.service}
                  onValueChange={handleServiceChange}
                  placeholder={servicesLoading ? "Loading services..." : "Search services..."}
                  searchPlaceholder="Search services..."
                  emptyText="No services found."
                  disabled={servicesLoading}
                  className="h-8 text-xs w-full"
              />
            </div>

            {/* Operation Filter with Search */}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Operation</Label>
              <Combobox
                  options={operationOptions}
                  value={filters.operation}
                  onValueChange={(value) => setFilters({ ...filters, operation: value })}
                  placeholder={
                    operationsLoading
                        ? "Loading operations..."
                        : !filters.service
                            ? "Select service first"
                            : filteredOperations.length === 0
                                ? "No operations available"
                                : "Search operations..."
                  }
                  searchPlaceholder="Search operations..."
                  emptyText="No operations found."
                  disabled={!filters.service || operationsLoading}
                  className="h-8 text-xs w-full"
              />
            </div>

            {/* Time Range Filter */}
            <TimeRangeSelector
                timeRange={filters.timeRange}
                onChange={(timeRange) => setFilters({ ...filters, timeRange })}
            />

            {/* Tags Filter with Operator */}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Tags</Label>
              <div className="grid grid-cols-12 gap-1">
                <Input
                    placeholder="Key"
                    value={tagKey}
                    onChange={(e) => setTagKey(e.target.value)}
                    className="h-8 text-xs col-span-4"
                />
                <Select value={tagOperator} onValueChange={(value: TagOperator) => setTagOperator(value)}>
                  <SelectTrigger className="h-8 text-xs col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tagOperators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{op.label}</span>
                            <span className="text-xs text-gray-500">{op.description}</span>
                          </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                    placeholder="Value"
                    value={tagValue}
                    onChange={(e) => setTagValue(e.target.value)}
                    className="h-8 text-xs col-span-4"
                />
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 col-span-1"
                    onClick={addTagFilter}
                    disabled={!tagKey.trim() || !tagValue.trim()}
                >
                  <Plus size={14} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(filters.tags || []).map((tag, index) => (
                    <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer font-mono text-xs"
                        onClick={() => removeTagFilter(index)}
                    >
                      {tag.key} {tag.operator} {tag.value}
                      <X size={12} className="ml-1" />
                    </Badge>
                ))}
              </div>
            </div>

            {/* Error Filter */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium" htmlFor="error-filter">
                Only show errors
              </Label>
              <Switch
                  id="error-filter"
                  checked={filters.hasError}
                  onCheckedChange={(checked) => setFilters({ ...filters, hasError: checked })}
              />
            </div>

            {/* Limit Filter */}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Limit</Label>
              <Input
                  type="number"
                  min={1}
                  value={filters.limit}
                  onChange={(e) => setFilters({ ...filters, limit: Number.parseInt(e.target.value) || 20 })}
                  className="h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>
  )
}
