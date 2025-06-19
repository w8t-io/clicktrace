package types

import "time"

// Event represents an event in the span
type Event struct {
	Timestamp  time.Time         `json:"timestamp"`
	Name       string            `json:"name"`
	Attributes map[string]string `json:"attributes"`
}

// Link represents a link in the span
type Link struct {
	TraceId    string            `json:"trace_id"`
	SpanId     string            `json:"span_id"`
	TraceState string            `json:"trace_state"`
	Attributes map[string]string `json:"attributes"`
}

// Span represents a single trace span
type Span struct {
	Timestamp          time.Time         `json:"timestamp"`
	TraceId            string            `json:"trace_id"`
	TraceState         string            `json:"trace_state"`
	SpanId             string            `json:"span_id"`
	ParentSpanId       string            `json:"parent_span_id"`
	SpanName           string            `json:"span_name"`
	SpanKind           string            `json:"span_kind"`
	ServiceName        string            `json:"service_name"`
	ResourceAttributes map[string]string `json:"resource_attributes"`
	ScopeName          string            `json:"scope_name"`
	ScopeVersion       string            `json:"scope_version"`
	SpanAttributes     map[string]string `json:"span_attributes"`
	Duration           uint64            `json:"duration"`
	StatusCode         string            `json:"status_code"`
	StatusMessage      string            `json:"status_message"`
	Events             []Event           `json:"events"`
	Links              []Link            `json:"links"`
}

// Trace represents a complete trace with multiple spans
type Trace struct {
	TraceId string `json:"trace_id"`
	Spans   []Span `json:"spans"`
}
