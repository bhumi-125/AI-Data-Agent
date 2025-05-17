"use client"

import type { Message } from "ai"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"
import { DataVisualization } from "@/components/data-visualization"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useEffect, useState } from "react"

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user"
  const [parsedContent, setParsedContent] = useState<any>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // Parse JSON content if it exists
  useEffect(() => {
    if (message.role === "assistant") {
      try {
        const parsed = JSON.parse(message.content)
        setParsedContent(parsed)
        setParseError(null)
      } catch (error) {
        console.error("Failed to parse JSON content", error)
        setParsedContent(null)
        setParseError(`Failed to parse response: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }, [message.content, message.role])

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%]", isUser ? "text-right" : "text-left")}>
        <div className="mb-1 text-sm font-medium">{isUser ? "You" : "AI Assistant"}</div>
        <Card className={cn("p-3", isUser ? "bg-primary/10" : "")}>
          {isUser ? (
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          ) : parseError ? (
            <div className="space-y-2">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>There was an error processing the response. Please try again.</AlertDescription>
              </Alert>
              {process.env.NODE_ENV === "development" && (
                <div className="text-xs text-red-500 mt-2">
                  <pre className="whitespace-pre-wrap">{parseError}</pre>
                  <pre className="whitespace-pre-wrap mt-2">Raw content: {message.content}</pre>
                </div>
              )}
            </div>
          ) : parsedContent ? (
            <div className="space-y-4">
              {parsedContent.explanation && <div className="text-sm">{parsedContent.explanation}</div>}

              {parsedContent.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{parsedContent.error}</AlertDescription>
                </Alert>
              )}

              {parsedContent.sql && (
                <div className="bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto">
                  <pre>{parsedContent.sql}</pre>
                </div>
              )}

              {parsedContent.data && (
                <div className="space-y-4">
                  <DataTable data={parsedContent.data} />

                  {parsedContent.visualization && (
                    <DataVisualization
                      type={parsedContent.visualization.type}
                      data={parsedContent.data}
                      config={parsedContent.visualization.config}
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          )}
        </Card>
      </div>
    </div>
  )
}
