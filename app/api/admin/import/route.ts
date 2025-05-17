import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { parse } from "csv-parse/sync"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file || !type) {
      return NextResponse.json({ error: "File and type are required" }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const text = new TextDecoder().decode(buffer)

    // Parse CSV
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    if (records.length === 0) {
      return NextResponse.json({ error: "No records found in file" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Process based on type
    switch (type) {
      case "customers":
        await importCustomers(sql, records)
        break
      case "products":
        await importProducts(sql, records)
        break
      case "orders":
        await importOrders(sql, records)
        break
      default:
        return NextResponse.json({ error: "Invalid import type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${records.length} ${type}`,
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Failed to import data" }, { status: 500 })
  }
}

async function importCustomers(sql: any, records: any[]) {
  for (const record of records) {
    await sql`
      INSERT INTO customers (name, email, sgmt, region_id)
      VALUES (
        ${record.name}, 
        ${record.email}, 
        ${record.segment}, 
        ${Number.parseInt(record.region_id)}
      )
      ON CONFLICT (email) DO UPDATE SET
        name = ${record.name},
        sgmt = ${record.segment},
        region_id = ${Number.parseInt(record.region_id)}
    `
  }
}

async function importProducts(sql: any, records: any[]) {
  for (const record of records) {
    await sql`
      INSERT INTO products (p_name, category, subcategory, price, cost)
      VALUES (
        ${record.name}, 
        ${record.category}, 
        ${record.subcategory}, 
        ${Number.parseFloat(record.price)}, 
        ${Number.parseFloat(record.cost)}
      )
      ON CONFLICT (p_name) DO UPDATE SET
        category = ${record.category},
        subcategory = ${record.subcategory},
        price = ${Number.parseFloat(record.price)},
        cost = ${Number.parseFloat(record.cost)}
    `
  }
}

async function importOrders(sql: any, records: any[]) {
  // Group records by order_id
  const orderMap = new Map()

  for (const record of records) {
    const orderId = record.order_id

    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, {
        customer_id: Number.parseInt(record.customer_id),
        order_date: record.order_date,
        status: record.status,
        items: [],
      })
    }

    orderMap.get(orderId).items.push({
      product_id: Number.parseInt(record.product_id),
      quantity: Number.parseInt(record.quantity),
      unit_price: Number.parseFloat(record.unit_price),
    })
  }

  // Process each order
  for (const [orderId, orderData] of orderMap.entries()) {
    // Calculate total amount
    const totalAmount = orderData.items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0)

    // Begin transaction
    await sql`BEGIN`

    try {
      // Insert order
      const orderResult = await sql`
        INSERT INTO orders (customer_id, order_date, status, total_amount)
        VALUES (
          ${orderData.customer_id}, 
          ${orderData.order_date}, 
          ${orderData.status}, 
          ${totalAmount}
        )
        RETURNING id
      `

      const newOrderId = orderResult[0].id

      // Insert order items
      for (const item of orderData.items) {
        await sql`
          INSERT INTO order_items (order_id, product_id, qty, unit_price)
          VALUES (
            ${newOrderId}, 
            ${item.product_id}, 
            ${item.quantity}, 
            ${item.unit_price}
          )
        `
      }

      // Commit transaction
      await sql`COMMIT`
    } catch (error) {
      // Rollback on error
      await sql`ROLLBACK`
      throw error
    }
  }
}
