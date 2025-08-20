package client

import (
	"clicktrace/internal/types"
	tools2 "clicktrace/pkg/tools"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"github.com/ClickHouse/clickhouse-go/v2"
	"log"
	"strings"
	"time"
)

type ClickHouse struct {
	ctx      context.Context
	Conn     *sql.DB
	Database string
	Table    string
}

func NewClickHouseClient(ctx context.Context, conf types.ClickHouseConfig) (*ClickHouse, error) {
	conn := clickhouse.OpenDB(&clickhouse.Options{
		Addr: conf.Addr,
		Auth: clickhouse.Auth{
			Username: conf.User,
			Password: conf.Pass,
		},
		Settings: clickhouse.Settings{
			"max_execution_time": 60,
		},
		DialTimeout: time.Second * time.Duration(conf.Timeout),
	})
	if conn == nil {
		return nil, errors.New("clickhouse connection failed")
	}

	return &ClickHouse{
		ctx:      ctx,
		Conn:     conn,
		Database: conf.Database,
		Table:    conf.Table,
	}, nil
}

func (c ClickHouse) buildGetTracesSQL(query types.GetTracesRequest) (string, []interface{}) {
	var conditions []string
	var args []interface{}

	// 匹配 ServiceName
	conditions = append(conditions, "ServiceName = ?")
	args = append(args, query.Service)

	parsedConditions := tools2.ParseQueryConditions(query.Tags)

	// 匹配 tags
	for _, condition := range parsedConditions {
		var conditionSQL string
		switch condition.Operator {
		case "==":
			conditionSQL = "SpanAttributes[?] = ?"
			args = append(args, condition.Key, condition.Value)
		case "=~":
			// Use ClickHouse's match function for true regex matching
			conditionSQL = "match(SpanAttributes[?], ?)"
			args = append(args, condition.Key, condition.Value)
		case "!=":
			conditionSQL = "SpanAttributes[?] != ?"
			args = append(args, condition.Key, condition.Value)
		case "!~":
			// Use ClickHouse's match function with NOT for non-regex matching
			conditionSQL = "NOT match(SpanAttributes[?], ?)"
			args = append(args, condition.Key, condition.Value)
		default:
			log.Printf("Unsupported tag operator: %s", condition.Operator)
			continue
		}
		conditions = append(conditions, conditionSQL)
	}

	// 匹配 Operation
	if query.Operation != "" {
		conditions = append(conditions, "SpanName = ?")
		args = append(args, query.Operation)
	}

	// 匹配时间范围
	if query.Scope > 0 {
		end := time.Now()
		start := tools2.ParserDuration(end, query.Scope)
		format := "2006-01-02 15:04:05.000000000"
		conditions = append(conditions, "Timestamp >= ? AND Timestamp <= ?")
		args = append(args, start.Format(format), end.Format(format))
	}

	// 构建查询条件
	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// 添加 limit 限制
	limit := query.Limit
	if limit <= 0 {
		limit = 10 // Default limit
	}

	sql := fmt.Sprintf(`
SELECT
    *
FROM
    %s.%s
%s
ORDER BY Timestamp DESC
LIMIT 0,%d
`, c.Database, c.Table, whereClause, limit)

	return sql, args
}

func (c ClickHouse) buildGetSpansSQL(query types.GetSpansRequest) (string, []interface{}) {
	var conditions []string
	var args []interface{}

	// 匹配 ServiceName
	conditions = append(conditions, "TraceId = ?")
	args = append(args, query.TraceId)

	// 构建查询条件
	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	sql := fmt.Sprintf(`
SELECT
    *
FROM
    %s.%s
%s
`, c.Database, c.Table, whereClause)

	return sql, args
}

func (c ClickHouse) GetServices() []string {
	var services = *new([]string)

	rows, err := c.Conn.QueryContext(c.ctx, fmt.Sprintf(`
SELECT DISTINCT
	ServiceName
FROM 
	%s.%s`, c.Database, c.Table))
	if err != nil {
		log.Fatalf("GetService failed: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var service string
		err := rows.Scan(
			&service,
		)

		if err != nil {
			log.Fatalf("GetService Row scan failed: %v", err)
		}

		services = append(services, service)
	}

	return services
}

func (c ClickHouse) GetOperations(req types.GetOperationsRequest) []string {
	var services = *new([]string)

	rows, err := c.Conn.QueryContext(c.ctx, fmt.Sprintf(`
SELECT DISTINCT
	SpanName
FROM 
	%s.%s
WHERE ServiceName = '%s'`, c.Database, c.Table, req.Service))
	if err != nil {
		log.Fatalf("GetService failed: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var service string
		err := rows.Scan(
			&service,
		)

		if err != nil {
			log.Fatalf("GetService Row scan failed: %v", err)
		}

		services = append(services, service)
	}

	return services
}

func (c ClickHouse) GetTraces(query types.GetTracesRequest) ([]types.Trace, error) {
	// 构建 SQL 和参数
	sqlQuery, args := c.buildGetTracesSQL(query)

	// 执行查询
	rows, err := c.Conn.QueryContext(c.ctx, sqlQuery, args...)
	if err != nil {
		log.Fatalf("Query failed: %v", err)
	}
	defer rows.Close()

	// 解析结果
	traceMap := make(map[string]*types.Trace) // Key: TraceId, Value: Trace
	for rows.Next() {
		var span types.Span
		var eventsTimestamps []time.Time
		var eventsNames []string
		var eventsAttributes []map[string]string
		var linksTraceIds []string
		var linksSpanIds []string
		var linksTraceStates []string
		var linksAttributes []map[string]string

		err := rows.Scan(
			&span.Timestamp, &span.TraceId, &span.SpanId, &span.ParentSpanId, &span.TraceState, &span.SpanName,
			&span.SpanKind, &span.ServiceName, &span.ResourceAttributes, &span.ScopeName, &span.ScopeVersion,
			&span.SpanAttributes, &span.Duration, &span.StatusCode, &span.StatusMessage,
			&eventsTimestamps, &eventsNames, &eventsAttributes,
			&linksTraceIds, &linksSpanIds, &linksTraceStates, &linksAttributes,
		)
		if err != nil {
			log.Fatalf("Row scan failed: %v", err)
		}

		// 构造 Events
		for i := range eventsTimestamps {
			span.Events = append(span.Events, types.Event{
				Timestamp:  eventsTimestamps[i],
				Name:       eventsNames[i],
				Attributes: eventsAttributes[i],
			})
		}

		// 构造 Links
		for i := range linksTraceIds {
			span.Links = append(span.Links, types.Link{
				TraceId:    linksTraceIds[i],
				SpanId:     linksSpanIds[i],
				TraceState: linksTraceStates[i],
				Attributes: linksAttributes[i],
			})
		}

		// 将 Span 添加到对应的 Trace
		if _, exists := traceMap[span.TraceId]; !exists {
			traceMap[span.TraceId] = &types.Trace{
				TraceId: span.TraceId,
				Spans:   []types.Span{},
			}
		}
		traceMap[span.TraceId].Spans = append(traceMap[span.TraceId].Spans, span)
	}

	traces := make([]types.Trace, 0, len(traceMap))
	for _, trace := range traceMap {
		traces = append(traces, *trace)
	}

	return traces, nil
}

func (c ClickHouse) GetSpans(query types.GetSpansRequest) (*types.Trace, error) {
	// 构建 SQL 和参数
	sqlQuery, args := c.buildGetSpansSQL(query)

	// 执行查询
	rows, err := c.Conn.QueryContext(c.ctx, sqlQuery, args...)
	if err != nil {
		log.Fatalf("Query failed: %v", err)
	}
	defer rows.Close()

	// 解析结果
	var trace = &types.Trace{
		TraceId: query.TraceId,
		Spans:   []types.Span{},
	}
	for rows.Next() {
		var span types.Span
		var eventsTimestamps []time.Time
		var eventsNames []string
		var eventsAttributes []map[string]string
		var linksTraceIds []string
		var linksSpanIds []string
		var linksTraceStates []string
		var linksAttributes []map[string]string

		err := rows.Scan(
			&span.Timestamp, &span.TraceId, &span.SpanId, &span.ParentSpanId, &span.TraceState, &span.SpanName,
			&span.SpanKind, &span.ServiceName, &span.ResourceAttributes, &span.ScopeName, &span.ScopeVersion,
			&span.SpanAttributes, &span.Duration, &span.StatusCode, &span.StatusMessage,
			&eventsTimestamps, &eventsNames, &eventsAttributes,
			&linksTraceIds, &linksSpanIds, &linksTraceStates, &linksAttributes,
		)
		if err != nil {
			log.Fatalf("Row scan failed: %v", err)
		}

		// 构造 Events
		for i := range eventsTimestamps {
			span.Events = append(span.Events, types.Event{
				Timestamp:  eventsTimestamps[i],
				Name:       eventsNames[i],
				Attributes: eventsAttributes[i],
			})
		}

		// 构造 Links
		for i := range linksTraceIds {
			span.Links = append(span.Links, types.Link{
				TraceId:    linksTraceIds[i],
				SpanId:     linksSpanIds[i],
				TraceState: linksTraceStates[i],
				Attributes: linksAttributes[i],
			})
		}

		// 将 Span 添加到对应的 Trace
		trace.Spans = append(trace.Spans, span)
	}

	return trace, nil
}
