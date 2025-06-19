package tools

import (
	"clicktrace/internal/types"
	"strings"
)

// ParseQueryConditions parses the input query string into a slice of QueryCondition
func ParseQueryConditions(tags string) (conditions []types.QueryCondition) {
	list := strings.Split(tags, " ")
	for _, tag := range list {
		if strings.Contains(tag, "=~") {
			keyValue := strings.SplitN(tag, "=~", 2)
			if len(keyValue) == 2 {
				conditions = append(conditions, types.QueryCondition{
					Key:      keyValue[0],
					Value:    keyValue[1],
					Operator: "=~",
				})
			}
		} else if strings.Contains(tag, "==") {
			keyValue := strings.SplitN(tag, "==", 2)
			if len(keyValue) == 2 {
				conditions = append(conditions, types.QueryCondition{
					Key:      keyValue[0],
					Value:    keyValue[1],
					Operator: "==",
				})
			}
		} else if strings.Contains(tag, "!=") {
			keyValue := strings.SplitN(tag, "!=", 2)
			if len(keyValue) == 2 {
				conditions = append(conditions, types.QueryCondition{
					Key:      keyValue[0],
					Value:    keyValue[1],
					Operator: "!=",
				})
			}
		} else if strings.Contains(tag, "!~") {
			keyValue := strings.SplitN(tag, "!~", 2)
			if len(keyValue) == 2 {
				conditions = append(conditions, types.QueryCondition{
					Key:      keyValue[0],
					Value:    keyValue[1],
					Operator: "!~",
				})
			}
		}
	}
	return
}
