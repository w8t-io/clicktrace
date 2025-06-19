package handle

import (
	"clicktrace/internal/service"
	"clicktrace/internal/types"
	"clicktrace/pkg/respond"
	"clicktrace/pkg/tools"
	"github.com/gin-gonic/gin"
)

type server struct{}

var Server = new(server)

func (s server) API(gin *gin.Engine) {
	api := gin.Group("api")
	{
		api.GET("services", s.Services)
		api.GET("operations", s.Operations)
		api.GET("traces", s.Traces)
		api.GET("trace/:id", s.Spans)
	}
}

func (s server) Services(ctx *gin.Context) {
	services, err := service.Server.GetServices(nil)
	if err != nil {
		respond.Error(ctx.Writer, err.Error())
		return
	}

	respond.Success(ctx.Writer, services)
}

func (s server) Operations(ctx *gin.Context) {
	var request types.GetOperationsRequest
	request.Service = ctx.Query("service")
	operations, err := service.Server.GetOperations(request)
	if err != nil {
		respond.Error(ctx.Writer, err.Error())
		return
	}

	respond.Success(ctx.Writer, operations)
}

func (s server) Traces(ctx *gin.Context) {
	var request types.GetTracesRequest
	request.Service = ctx.Query("service")
	request.Operation = ctx.Query("operation")
	request.Tags = ctx.Query("tags")
	request.Limit = tools.ConvertStringToInt(ctx.Query("limit"))

	traces, err := service.Server.GetTraces(request)
	if err != nil {
		respond.Error(ctx.Writer, err.Error())
		return
	}

	respond.Success(ctx.Writer, traces)
}

func (s server) Spans(ctx *gin.Context) {
	var request types.GetSpansRequest
	request.TraceId = ctx.Param("id")

	spans, err := service.Server.GetSpans(request)
	if err != nil {
		respond.Error(ctx.Writer, err.Error())
		return
	}

	respond.Success(ctx.Writer, spans)
}
