import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clock, Tag, Settings, Info } from "lucide-react"
import type { Span } from "@/lib/types"
import { formatDuration, formatTimestamp } from "@/lib/utils"

interface SpanDetailProps {
  span: Span
}

export default function SpanDetail({ span }: SpanDetailProps) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold truncate" title={span.operationName}>
          {span.operationName}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {span.serviceName}
          </Badge>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Clock size={12} />
            {formatDuration(span.duration)}
          </div>
          {span.hasError && (
            <Badge variant="destructive" className="text-xs">
              Error
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-8">
          <TabsTrigger value="overview" className="text-xs">
            Overview
          </TabsTrigger>
          <TabsTrigger value="tags" className="text-xs">
            Tags
          </TabsTrigger>
          <TabsTrigger value="process" className="text-xs">
            Process
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-3">
          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <div className="font-medium text-gray-600">Service:</div>
            <div>{span.serviceName}</div>

            <div className="font-medium text-gray-600">Operation:</div>
            <div>{span.operationName}</div>

            <div className="font-medium text-gray-600">Span ID:</div>
            <div className="font-mono text-xs truncate" title={span.spanId}>
              {span.spanId}
            </div>

            <div className="font-medium text-gray-600">Parent Span:</div>
            <div className="font-mono text-xs truncate" title={span.parentSpanId || "None"}>
              {span.parentSpanId || "None"}
            </div>

            <div className="font-medium text-gray-600">Start Time:</div>
            <div>{formatTimestamp(span.startTime)}</div>

            <div className="font-medium text-gray-600">Duration:</div>
            <div>{formatDuration(span.duration)}</div>

            {span.spanKind && (
              <>
                <div className="font-medium text-gray-600">Span Kind:</div>
                <div>{span.spanKind}</div>
              </>
            )}

            {span.statusCode && (
              <>
                <div className="font-medium text-gray-600">Status:</div>
                <div className="flex items-center gap-1">
                  <span>{span.statusCode}</span>
                  {span.statusMessage && <span className="text-gray-500">({span.statusMessage})</span>}
                </div>
              </>
            )}

            {span.scopeName && (
              <>
                <div className="font-medium text-gray-600">Scope:</div>
                <div>
                  {span.scopeName}
                  {span.scopeVersion && <span className="text-gray-500 ml-1">v{span.scopeVersion}</span>}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tags" className="pt-3">
          {span.tags && span.tags.length > 0 ? (
            <div className="space-y-2">
              {span.tags.map((tag, index) => (
                <div key={index} className="flex items-start p-2 bg-gray-50 rounded-md">
                  <Tag size={14} className="mr-2 mt-0.5 text-gray-500" />
                  <div className="flex-1">
                    <div className="font-medium text-xs">{tag.key}</div>
                    <div className="text-xs break-all mt-0.5">{tag.value}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Tag size={24} className="mb-2" />
              <p className="text-xs">No tags available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="process" className="pt-3">
          {span.process && span.process.length > 0 ? (
            <div className="space-y-2">
              {span.process.map((proc, index) => (
                <div key={index} className="flex items-start p-2 bg-blue-50 rounded-md">
                  <Settings size={14} className="mr-2 mt-0.5 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium text-xs">{proc.key}</div>
                    <div className="text-xs break-all mt-0.5">{proc.value}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Settings size={24} className="mb-2" />
              <p className="text-xs">No process information available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="pt-3">
          {span.logs && span.logs.length > 0 ? (
            <div className="space-y-3">
              {span.logs.map((log, index) => (
                <div key={index} className="border-l-2 border-gray-300 pl-3">
                  <div className="text-xs text-gray-500 mb-1">{formatTimestamp(log.timestamp)}</div>
                  {log.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="mb-1">
                      <div className="font-medium text-xs">{field.key}</div>
                      <div className="text-xs break-all bg-gray-50 p-1 rounded mt-0.5">{field.value}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Info size={24} className="mb-2" />
              <p className="text-xs">No logs available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
