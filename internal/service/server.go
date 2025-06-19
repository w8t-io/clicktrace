package service

import (
	"clicktrace/internal/ctx"
	"clicktrace/internal/types"
)

type (
	server struct {
		ctx *ctx.Context
	}

	ServerInter interface {
		GetServices(req interface{}) (interface{}, error)
		GetOperations(req interface{}) (interface{}, error)
		GetTraces(req interface{}) (interface{}, error)
		GetSpans(req interface{}) (interface{}, error)
	}
)

func NewServer(ctx *ctx.Context) ServerInter {
	return server{ctx: ctx}
}

func (s server) GetServices(req interface{}) (interface{}, error) {
	return s.ctx.CK.GetServices(), nil
}

func (s server) GetOperations(req interface{}) (interface{}, error) {
	r := req.(types.GetOperationsRequest)
	return s.ctx.CK.GetOperations(r), nil
}

func (s server) GetTraces(req interface{}) (interface{}, error) {
	r := req.(types.GetTracesRequest)
	traces, err := s.ctx.CK.GetTraces(r)
	if err != nil {
		return nil, err
	}

	return traces, nil
}

func (s server) GetSpans(req interface{}) (interface{}, error) {
	r := req.(types.GetSpansRequest)
	traces, err := s.ctx.CK.GetSpans(r)
	if err != nil {
		return nil, err
	}

	return traces, nil
}
