"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import { formatDuration, formatTimestamp } from "@/lib/utils"
import TraceListFilters from "./trace-list-filters"
import type { TraceSummary, TraceListFilterCriteria } from "@/lib/types"
import { getTimeRangeFromPreset } from "@/lib/time-utils"
import { convertRealTraceToSummary } from "@/lib/data-transformer"
import { fetchServices, fetchOperations, fetchTraces } from "@/app/api/api"

interface TraceListProps {
  initialTraces?: TraceSummary[]
}

export default function TraceList({ initialTraces = [] }: TraceListProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<TraceListFilterCriteria>({
    service: "",
    operation: "",
    tags: [],
    timeRange: getTimeRangeFromPreset("24h"),
    limit: 20,
    hasError: false,
  })

  const [services, setServices] = useState<string[]>([])
  const [operations, setOperations] = useState<string[]>([])
  const [traces, setTraces] = useState<TraceSummary[]>(initialTraces)
  const [loading, setLoading] = useState(false)
  const [servicesLoading, setServicesLoading] = useState(true)
  const [operationsLoading, setOperationsLoading] = useState(false)

  // Create a mapping of services to their operations
  const serviceOperations = useMemo(() => {
    const mapping: Record<string, string[]> = {}

    if (filters.service && operations.length > 0) {
      mapping[filters.service] = operations
    }

    return mapping
  }, [filters.service, operations])

  // Load services on component mount
  useEffect(() => {
    loadServices()
  }, [])

  // Load operations when service changes
  useEffect(() => {
    const loadOperations = async () => {
      if (!filters.service) {
        setOperations([])
        return
      }

      try {
        setOperationsLoading(true)
        const operationsData = await fetchOperations(filters.service)
        setOperations(operationsData)
      } catch (error) {
        console.error("Failed to load operations:", error)
        setOperations([])
      } finally {
        setOperationsLoading(false)
      }
    }

    loadOperations()
  }, [filters.service])

  // Load traces when filters change
  useEffect(() => {
    loadTraces()
  }, [filters])

  const loadServices = async () => {
    try {
      setServicesLoading(true)
      const servicesData = await fetchServices()
      setServices(servicesData)
    } catch (error) {
      console.error("Failed to load services:", error)
    } finally {
      setServicesLoading(false)
    }
  }

  const loadTraces = async () => {
    try {
      setLoading(true)
      const tracesData = await fetchTraces(filters)
      const convertedTraces = tracesData.map(convertRealTraceToSummary)

      // Apply hasError filter on the frontend since it might not be handled by the API
      let filteredTraces = convertedTraces
      if (filters.hasError) {
        filteredTraces = convertedTraces.filter((trace) => trace.hasError === true)
      }

      setTraces(filteredTraces)
    } catch (error) {
      console.error("Failed to load traces:", error)
      setTraces([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await Promise.all([loadServices(), loadTraces()])
  }

  const handleTraceClick = (traceId: string) => {
    router.push(`/trace/${traceId}`)
  }

  return (
      <div className="h-[85vh]">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          {/* Filters Section */}
          <div className="lg:col-span-1 h-full overflow-y-auto">
            <TraceListFilters
                services={services}
                operations={operations}
                serviceOperations={serviceOperations}
                filters={filters}
                setFilters={setFilters}
                servicesLoading={servicesLoading}
                operationsLoading={operationsLoading}
                onRefresh={handleRefresh}
            />
          </div>

          {/* Traces List Section */}
          <div className="lg:col-span-3 h-full flex flex-col">
            <Card className="border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
              <CardContent className="p-3 flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-3 flex-shrink-0">
                  <h2 className="text-sm font-semibold">Traces</h2>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    {loading && <Loader2 size={12} className="animate-spin" />}
                    Showing {traces.length} traces
                    {filters.hasError && (
                        <Badge variant="destructive" className="text-xs">
                          Errors Only
                        </Badge>
                    )}
                  </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center flex-1 text-gray-500">
                      <Loader2 size={24} className="animate-spin mr-2" />
                      Loading traces...
                    </div>
                ) : traces.length > 0 ? (
                    <div className="space-y-2 pr-2 h-[80vh] overflow-y-auto">
                      {traces.map((trace) => (
                          <div
                              key={trace.traceId}
                              className="border rounded-md p-3 hover:bg-gray-50 cursor-pointer transition-colors flex-shrink-0"
                              onClick={() => handleTraceClick(trace.traceId)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm truncate">{trace.name}</span>
                                  {trace.hasError && <AlertCircle size={14} className="text-red-500 flex-shrink-0"/>}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatTimestamp(trace.timestamp)} • {trace.spanCount} spans
                                </div>
                                <div className="text-xs text-gray-600 mt-1 font-mono truncate">
                                  {trace.traceId.substring(0, 16)}...
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <div className="flex items-center text-xs text-gray-500">
                                  <Clock size={12} className="mr-1"/>
                                  {formatDuration(trace.duration)}
                                </div>
                                <ChevronRight size={16} className="text-gray-400"/>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(trace.services || []).slice(0, 3).map((service) => (
                                  <Badge key={service} variant="outline" className="text-xs">
                                    {service}
                                  </Badge>
                              ))}
                              {(trace.services || []).length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{(trace.services || []).length - 3} more
                                  </Badge>
                              )}
                            </div>
                          </div>
                      ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center flex-1 text-gray-500">
                      {filters.hasError ? "No error traces found" : "No traces match the current filters"}
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )
}
