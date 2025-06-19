package respond

import (
	"encoding/json"
	"net/http"
)

// Response 定义了标准的 JSON 响应结构
type Response struct {
	Status string      `json:"status"` // 状态（如 "success" 或 "error"）
	Data   interface{} `json:"data"`   // 内容
}

// rJson 封装了一个通用的 JSON 响应方法
func rJson(w http.ResponseWriter, statusCode int, response Response) {

	// 设置响应头
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	// 编码并返回 JSON 数据
	if err := json.NewEncoder(w).Encode(response); err != nil {
		// 如果编码失败，记录错误并返回内部服务器错误
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

// Success 封装了一个通用的成功响应方法
func Success(w http.ResponseWriter, data interface{}) {
	rJson(w, http.StatusOK, Response{
		Status: "success",
		Data:   data,
	})
}

// Error 封装了一个通用的错误响应方法
func Error(w http.ResponseWriter, data interface{}) {
	rJson(w, http.StatusBadRequest, Response{
		Status: "error",
		Data:   data,
	})
}

func Abnormal(w http.ResponseWriter, data interface{}) {
	rJson(w, http.StatusOK, Response{
		Status: "error",
		Data:   data,
	})
}
