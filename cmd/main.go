package main

import (
	ctx "clicktrace/internal/ctx"
	"clicktrace/internal/handle"
	"clicktrace/internal/middleware"
	"clicktrace/internal/service"
	"clicktrace/internal/types"
	"clicktrace/pkg/client"
	"clicktrace/pkg/tools"
	"context"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/zeromicro/go-zero/core/logc"
	"os"
	"strings"
)

func main() {
	logc.Info(context.Background(), "服务启动")
	gin.SetMode(gin.ReleaseMode)
	ginEngine := gin.New()
	ginEngine.Use(
		middleware.Cors(),
		gin.Recovery(),
	)

	c := context.Background()

	config, err := getConfig()
	if err != nil {
		logc.Error(context.Background(), err)
		return
	}
	//types.ClickHouseConfig{
	//		Addr:     "192.168.1.190:30190",
	//		User:     "root",
	//		Pass:     "admin123",
	//		Timeout:  10,
	//		Database: "default",
	//		Table:    "otel_traces",
	//	}
	houseClient, err := client.NewClickHouseClient(c, config)
	if err != nil {
		fmt.Println(err.Error())
		return
	}

	service.NewService(ctx.NewContext(c, houseClient))
	handle.Server.API(ginEngine)

	err = ginEngine.Run(":8080")
	if err != nil {
		logc.Error(context.Background(), "服务启动失败:", err)
		return
	}
}

func getConfig() (types.ClickHouseConfig, error) {
	var conf types.ClickHouseConfig
	addr := os.Getenv("CLICKHOUSE_ADDR")
	if len(addr) <= 0 {
		return conf, errors.New("CLICKHOUSE_ADDR is null, please set")
	}

	user := os.Getenv("CLICKHOUSE_USER")
	if len(user) <= 0 {
		return conf, errors.New("CLICKHOUSE_USER is null, please set")
	}

	pass := os.Getenv("CLICKHOUSE_PASSWORD")
	if len(pass) <= 0 {
		return conf, errors.New("CLICKHOUSE_PASSWORD is null, please set")
	}

	db := os.Getenv("CLICKHOUSE_DATABASE")
	if len(db) <= 0 {
		return conf, errors.New("CLICKHOUSE_DATABASE is null, please set")
	}

	table := os.Getenv("CLICKHOUSE_TABLE")
	if len(table) <= 0 {
		return conf, errors.New("CLICKHOUSE_TABLE is null, please set")
	}

	timeout := os.Getenv("CLICKHOUSE_TIMEOUT")
	if len(timeout) <= 0 {
		return conf, errors.New("CLICKHOUSE_TIMEOUT is null, please set")
	}

	conf.Addr = strings.Split(addr, ",")
	conf.User = user
	conf.Pass = pass
	conf.Database = db
	conf.Table = table
	conf.Timeout = tools.ConvertStringToInt(timeout)

	return conf, nil
}
