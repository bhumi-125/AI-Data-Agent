"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { Database, Github, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useState } from "react"

export function Header() {
  const [isClearing, setIsClearing] = useState(false)

  const clearCache = async () => {
    setIsClearing(true)
    try {
      const response = await fetch("/api/cache/clear", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to clear cache")
      }

      const data = await response.json()

      toast({
        title: "Cache cleared",
        description: data.message || "Query cache has been cleared successfully",
      })
    } catch (error) {
      console.error("Error clearing cache:", error)
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h1 className="text-xl font-bold">AI Data Agent</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCache}
            disabled={isClearing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isClearing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Clear Cache</span>
          </Button>
          <Link
            href="https://github.com/yourusername/ai-data-agent"
            target="_blank"
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Github className="h-5 w-5" />
            <span className="hidden sm:inline">GitHub</span>
          </Link>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
