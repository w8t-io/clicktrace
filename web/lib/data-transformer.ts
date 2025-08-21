import type { RealTraceData, RealSpan, Trace, Span, TraceSummary, Tag, Process } from "./types"

// Convert real span attributes to our tag format
function convertAttributesToTags(attributes: Record<string, any>): Tag[] {
  return Object.entries(attributes).map(([key, value]) => ({
    key,
    value: String(value),
  }))
}

// Convert real resource attributes to our process format
function convertResourceAttributesToProcess(attributes: Record<string, any>): Process[] {
  return Object.entries(attributes).map(([key, value]) => ({
    key,
    value: String(value),
  }))
}

// Convert real span to our internal span format
function convertRealSpanToSpan(realSpan: RealSpan): Span {
  // Separate span attributes (tags) and resource attributes (process)
  const tags: Tag[] = convertAttributesToTags(realSpan.span_attributes)
  const process: Process[] = convertResourceAttributesToProcess(realSpan.resource_attributes)

  // Robust error detection
  const statusCodeUpper = String(realSpan.status_code || "").toUpperCase()
  const hasStatusError = statusCodeUpper === "STATUS_CODE_ERROR" || statusCodeUpper === "ERROR"

  const httpStatusRaw =
    (realSpan.span_attributes as any)["http.status_code"] ??
    (realSpan.span_attributes as any)["http.response.status_code"]
  const httpStatus = httpStatusRaw != null ? parseInt(String(httpStatusRaw), 10) : undefined
  const hasHttpError = typeof httpStatus === "number" && !Number.isNaN(httpStatus) && httpStatus >= 400

  const hasExceptionEvent = Array.isArray(realSpan.events)
    ? realSpan.events.some((e: any) => e && e.name === "exception")
    : false

  const hasError = hasStatusError || hasHttpError || hasExceptionEvent || realSpan.status_message !== ""

  return {
    spanId: realSpan.span_id,
    parentSpanId: realSpan.parent_span_id || undefined,
    operationName: realSpan.span_name,
    serviceName: realSpan.service_name,
    startTime: new Date(realSpan.timestamp).getTime() * 1000, // ms -> μs
    // OpenTelemetry duration is commonly in nanoseconds; convert to microseconds for UI
    duration: Math.floor(realSpan.duration / 1000),
    tags,
    process,
    hasError,
    spanKind: realSpan.span_kind,
    scopeName: realSpan.scope_name,
    scopeVersion: realSpan.scope_version,
    statusCode: realSpan.status_code,
    statusMessage: realSpan.status_message,
  }
}

// Convert real trace data to our internal trace format
export function convertRealTraceToTrace(realTraceData: RealTraceData): Trace {
  const spans = realTraceData.spans.map(convertRealSpanToSpan)
  const services = [...new Set(spans.map((span) => span.serviceName))]

  return {
    traceId: realTraceData.trace_id,
    services,
    spans,
  }
}

// Convert real trace data to trace summary for list view
export function convertRealTraceToSummary(realTraceData: RealTraceData): TraceSummary {
  const spans = realTraceData.spans.map(convertRealSpanToSpan)
  const services = [...new Set(spans.map((span) => span.serviceName))]
  const operations = [...new Set(spans.map((span) => span.operationName))]

  // Calculate total duration and find earliest timestamp
  const startTime = Math.min(...spans.map((span) => span.startTime))
  const endTime = Math.max(...spans.map((span) => span.startTime + span.duration))
  const totalDuration = endTime - startTime

  // Check if any span has error
  const hasError = spans.some((span) => span.hasError)

  // Create service to operations mapping
  const serviceOperations: Record<string, string[]> = {}
  spans.forEach((span) => {
    if (!serviceOperations[span.serviceName]) {
      serviceOperations[span.serviceName] = []
    }
    if (!serviceOperations[span.serviceName].includes(span.operationName)) {
      serviceOperations[span.serviceName].push(span.operationName)
    }
  })

  // Get the main operation name (usually the root span or first span)
  const mainOperation = spans.find((span) => !span.parentSpanId)?.operationName || spans[0]?.operationName || "Unknown"

  // Extract common tags from span attributes (not resource attributes)
  const commonTags: Tag[] = []
  if (spans.length > 0) {
    const firstSpan = spans[0]
    const httpMethod = firstSpan.tags?.find((tag) => tag.key === "http.request.method")
    const urlFull = firstSpan.tags?.find((tag) => tag.key === "url.full")

    if (httpMethod) commonTags.push(httpMethod)
    if (urlFull) commonTags.push(urlFull)
  }

  return {
    traceId: realTraceData.trace_id,
    name: mainOperation,
    timestamp: startTime,
    duration: totalDuration,
    spanCount: spans.length,
    services,
    operations,
    serviceOperations,
    hasError,
    tags: commonTags,
  }
}
