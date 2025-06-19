// Real OpenTelemetry data structure types
export interface RealSpanAttributes {
  [key: string]: string | number | boolean
}

export interface RealResourceAttributes {
  "service.name": string
  "telemetry.sdk.language": string
  "telemetry.sdk.name": string
  "telemetry.sdk.version": string
}

export interface RealSpan {
  timestamp: string
  trace_id: string
  trace_state: string
  span_id: string
  parent_span_id: string
  span_name: string
  span_kind: string
  service_name: string
  resource_attributes: RealResourceAttributes
  scope_name: string
  scope_version: string
  span_attributes: RealSpanAttributes
  duration: number
  status_code: string
  status_message: string
  events: any[] | null
  links: any[] | null
}

export interface RealTraceData {
  trace_id: string
  spans: RealSpan[]
}

// Internal application types (converted from real data)
export interface Tag {
  key: string
  value: string
}

export interface Process {
  key: string
  value: string
}

export interface LogField {
  key: string
  value: string
}

export interface Log {
  timestamp: number
  fields: LogField[]
}

export interface Span {
  spanId: string
  parentSpanId?: string
  operationName: string
  serviceName: string
  startTime: number
  duration: number
  tags?: Tag[]
  process?: Process[]
  logs?: Log[]
  hasError?: boolean
  spanKind?: string
  scopeName?: string
  scopeVersion?: string
  statusCode?: string
  statusMessage?: string
}

export interface Trace {
  traceId: string
  services: string[]
  spans: Span[]
}

export type TagOperator = "==" | "!=" | "=~" | "!~"

export interface TagFilter {
  key: string
  operator: TagOperator
  value: string
}

export type TimeRangePreset = "5m" | "10m" | "30m" | "1h" | "6h" | "12h" | "24h" | "custom"

export interface TimeRange {
  preset: TimeRangePreset
  startTime?: number // Unix timestamp in milliseconds
  endTime?: number // Unix timestamp in milliseconds
}

export interface FilterCriteria {
  services: string[]
  operations: string[]
  tags: TagFilter[]
  timeRange: TimeRange
  limit: number
}

export interface TraceSummary {
  traceId: string
  name: string
  timestamp: number
  duration: number
  spanCount: number
  services: string[]
  operations: string[]
  serviceOperations?: Record<string, string[]>
  hasError: boolean
  tags: Tag[]
}

export interface TraceListFilterCriteria {
  service: string
  operation: string
  tags: TagFilter[]
  timeRange: TimeRange
  limit: number
  hasError: boolean
}
