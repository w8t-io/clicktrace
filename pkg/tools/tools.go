package tools

import (
	"context"
	"fmt"
	"github.com/sirupsen/logrus"
	"github.com/zeromicro/go-zero/core/logc"
	"strconv"
	"time"
)

// ParserDuration 获取时间区间的开始时间
func ParserDuration(curTime time.Time, logScope int) time.Time {
	duration, err := time.ParseDuration(strconv.Itoa(logScope) + "m")
	if err != nil {
		logrus.Error(err.Error())
		return time.Time{}
	}
	startsAt := curTime.Add(-duration)
	return startsAt
}

func ConvertStringToInt(str string) int {
	num, err := strconv.Atoi(str)
	if err != nil {
		logc.Error(context.Background(), fmt.Sprintf("Convert String to int failed, err: %s", err.Error()))
		return 0
	}

	return num
}
