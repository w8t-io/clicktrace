"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import TraceVisualization from "@/components/trace-visualization"
import { convertRealTraceToTrace } from "@/lib/data-transformer"
import type { Trace, RealTraceData } from "@/lib/types"

export default function TraceDetailPage() {
    const params = useParams()
    const router = useRouter()

    // Safely extract traceId from params
    const traceId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : null

    const [trace, setTrace] = useState<Trace | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTrace = async () => {
            if (!traceId) {
                setError("Invalid trace ID")
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError(null)

                // In a real implementation, you'd have a specific API endpoint for single trace
                // For now, we'll fetch from the traces API with a trace ID filter
                const response = await fetch(`/api/trace/${encodeURIComponent(traceId)}`)

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const result = await response.json()

                if (result.status === "success" && result.data) {
                    const realTraceData: RealTraceData = result.data
                    const convertedTrace = convertRealTraceToTrace(realTraceData)
                    setTrace(convertedTrace)
                } else {
                    setError("Trace not found")
                }
            } catch (err) {
                console.error("Error fetching trace:", err)
                setError("Failed to load trace")
            } finally {
                setLoading(false)
            }
        }

        fetchTrace()
    }, [traceId])

    // Show error if no traceId
    if (!traceId) {
        return (
            <div className="container mx-auto py-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back to Traces
                </Button>
                <div className="flex items-center justify-center h-[400px]">
                    <p className="text-gray-500">Invalid trace ID</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="container mx-auto py-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back to Traces
                </Button>
                <div className="flex items-center justify-center h-[400px]">
                    <Loader2 size={24} className="animate-spin mr-2" />
                    <p className="text-gray-500">Loading trace...</p>
                </div>
            </div>
        )
    }

    if (error || !trace) {
        return (
            <div className="container mx-auto py-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back to Traces
                </Button>
                <div className="flex items-center justify-center h-[400px]">
                    <p className="text-gray-500">{error || "Trace not found"}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back to Traces
                </Button>
                <div className="text-sm text-gray-500">
                    Trace ID: <span className="font-mono">{traceId}</span>
                </div>
            </div>
            <TraceVisualization trace={trace} />
        </div>
    )
}
