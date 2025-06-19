package ctx

import (
	"clicktrace/pkg/client"
	"context"
)

type Context struct {
	CK  *client.ClickHouse
	Ctx context.Context
}

func NewContext(ctx context.Context, ck *client.ClickHouse) *Context {
	return &Context{
		CK:  ck,
		Ctx: ctx,
	}
}
