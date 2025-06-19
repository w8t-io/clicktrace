package types

type ClickHouseConfig struct {
	Addr     []string
	User     string
	Pass     string
	Database string
	Table    string
	Timeout  int
}

type GetOperationsRequest struct {
	Service string
}

type GetTracesRequest struct {
	Service   string
	Operation string
	Tags      string
	Scope     int
	Limit     int
}

type GetSpansRequest struct {
	TraceId string
}

// QueryCondition represents a parsed query condition
type QueryCondition struct {
	Key      string
	Value    string
	Operator string // "==", "=~", "!=", "!~"
}
