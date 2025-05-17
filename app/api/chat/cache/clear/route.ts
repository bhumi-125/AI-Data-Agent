import { NextResponse } from "next/server"
import { clearQueryCache } from "@/lib/database"

export const runtime = "nodejs"

export async function POST() {
  try {
    const result = clearQueryCache()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error clearing cache:", error)
    return NextResponse.json({ success: false, message: "Failed to clear cache" }, { status: 500 })
  }
}
