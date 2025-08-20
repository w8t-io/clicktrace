import type { RealTraceData, TraceListFilterCriteria } from "@/lib/types";

export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
}

// 经过优化的辅助函数，不再包含硬编码的 URL
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // baseUrl 已被移除。请求将发往当前域名下的相对路径
  // 例如，如果你的前端运行在 localhost:3000，
  // 请求 /api/services 就会发往 http://localhost:3000/api/services

  const url = endpoint;
  try {
    const response = await fetch(url, options);

    // 增加对非200状态码的检查，使错误处理更健壮
    if (!response.ok) {
      // 尝试解析JSON错误体，如果失败则使用状态文本
      let errorMessage = `API request failed with status ${response.status}: ${response.statusText}`;
      try {
        const errorResult: ApiResponse<never> = await response.json();
        if (errorResult.message) {
          errorMessage = errorResult.message;
        }
      } catch (e) {
        // 如果响应体不是JSON或解析失败，则忽略
      }
      throw new Error(errorMessage);
    }

    const result: ApiResponse<T> = await response.json();

    if (result.status === "success" && result.data !== undefined) {
      return result.data;
    }

    // 如果 status 不是 "success" 或 data 不存在
    throw new Error(result.message || `API responded with an error for endpoint: ${endpoint}`);
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error; // 将原始错误继续向上抛出，以便调用方可以处理
  }
}

// Fetch services list (无需改动)
export async function fetchServices(): Promise<string[]> {
  return apiRequest<string[]>(`/api/services`);
}

// Fetch operations for a specific service (无需改动)
export async function fetchOperations(service: string): Promise<string[]> {
  const params = new URLSearchParams({ service });
  return apiRequest<string[]>(`/api/operations?${params.toString()}`);
}

// Fetch traces with filters (无需改动)
export async function fetchTraces(filters: TraceListFilterCriteria): Promise<RealTraceData[]> {
  const params = new URLSearchParams();

  if (filters.service) {
    params.append("service", filters.service);
  }
  if (filters.operation) {
    params.append("operation", filters.operation);
  }
  if (filters.hasError) {
    params.append("hasError", "true");
  }
  params.append("limit", filters.limit.toString());
  params.append("timeRangePreset", filters.timeRange.preset);
  if (filters.timeRange.startTime) {
    params.append("startTime", new Date(filters.timeRange.startTime).toISOString());
  }
  if (filters.timeRange.endTime) {
    params.append("endTime", new Date(filters.timeRange.endTime).toISOString());
  }
  if (filters.tags.length > 0) {
    // 注意：直接 JSON.stringify 数组并通过 URL 参数传递可能不是所有后端都支持的标准方式。
    // 如果后端框架能自动解析，则可行。否则可能需要更复杂的参数格式。
    params.append("tags", JSON.stringify(filters.tags));
  }

  return apiRequest<RealTraceData[]>(`/api/traces?${params.toString()}`);
}