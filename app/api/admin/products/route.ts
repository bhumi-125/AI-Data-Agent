import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const runtime = "nodejs"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const products = await sql`
      SELECT id, p_name, category, subcategory, price, cost
      FROM products
      ORDER BY p_name
    `

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}
