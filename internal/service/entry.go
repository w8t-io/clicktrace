package service

import "clicktrace/internal/ctx"

var (
	Server ServerInter
)

func NewService(ctx *ctx.Context) {
	Server = NewServer(ctx)
}
