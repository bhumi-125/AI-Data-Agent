import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const runtime = "nodejs"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const customers = await sql`
      SELECT id, name, email, sgmt as segment, region_id
      FROM customers
      ORDER BY name
    `

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}
