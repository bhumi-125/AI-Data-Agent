"use client"

import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { ChatMessage } from "@/components/chat-message"
import { Spinner } from "@/components/spinner"
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    onError: (err) => {
      console.error("Chat error:", err)
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Debug state to show raw response
  const [debugInfo, setDebugInfo] = useState<{
    lastResponse: string | null
    parsedResponse: any | null
    error: string | null
  }>({
    lastResponse: null,
    parsedResponse: null,
    error: null,
  })

  // Process messages to handle JSON content
  const processedMessages = messages.map((message) => {
    if (message.role === "assistant") {
      try {
        // Try to parse as JSON
        JSON.parse(message.content)
        return message
      } catch (e) {
        // If it's not valid JSON, wrap it in a JSON structure
        return {
          ...message,
          content: JSON.stringify({
            explanation: message.content,
          }),
        }
      }
    }
    return message
  })

  // Debug: Log the latest assistant message when it changes
  useEffect(() => {
    const lastAssistantMessage = messages.filter((m) => m.role === "assistant").pop()

    if (lastAssistantMessage) {
      console.log("Last assistant message:", lastAssistantMessage)

      try {
        const parsed = JSON.parse(lastAssistantMessage.content)
        setDebugInfo({
          lastResponse: lastAssistantMessage.content,
          parsedResponse: parsed,
          error: null,
        })
      } catch (e) {
        setDebugInfo({
          lastResponse: lastAssistantMessage.content,
          parsedResponse: null,
          error: `Failed to parse response as JSON: ${e instanceof Error ? e.message : String(e)}`,
        })
      }
    }
  }, [messages])

  // Debug: Log any errors
  useEffect(() => {
    if (error) {
      console.error("Chat hook error:", error)
      setDebugInfo((prev) => ({
        ...prev,
        error: String(error),
      }))
    }
  }, [error])

  return (
    <Card className="h-[calc(100vh-10rem)]">
      <CardHeader>
        <CardTitle>Ask a question about your data</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-16rem)] px-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
              <p>Ask complex business questions about your data.</p>
              <p className="mt-2">For example:</p>
              <ul className="mt-4 space-y-2">
                <li>"What's the trend of sales by region over the last 6 months of 2023?"</li>
                <li>"Which products have the highest profit margin but lowest sales volume?"</li>
                <li>"Compare customer retention rates across different segments"</li>
                <li>"Identify unusual patterns in transaction data from last quarter"</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              {processedMessages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              )}

              {/* Debug info - only shown in development */}
              {process.env.NODE_ENV === "development" && debugInfo.error && (
                <div className="mt-4 p-2 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded text-xs">
                  <div className="font-bold text-red-600 dark:text-red-400">Error:</div>
                  <pre className="whitespace-pre-wrap overflow-auto">{debugInfo.error}</pre>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Input
            placeholder="Ask a question about your data..."
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
