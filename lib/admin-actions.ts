"use server"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function addCustomer(data: {
  name: string
  email: string
  segment: string
  regionId: string
}) {
  try {
    await sql`
      INSERT INTO customers (name, email, sgmt, region_id)
      VALUES (${data.name}, ${data.email}, ${data.segment}, ${Number.parseInt(data.regionId)})
    `
    return { success: true }
  } catch (error) {
    console.error("Error adding customer:", error)
    throw new Error("Failed to add customer")
  }
}

export async function addProduct(data: {
  name: string
  category: string
  subcategory: string
  price: string
  cost: string
}) {
  try {
    await sql`
      INSERT INTO products (p_name, category, subcategory, price, cost)
      VALUES (
        ${data.name}, 
        ${data.category}, 
        ${data.subcategory}, 
        ${Number.parseFloat(data.price)}, 
        ${Number.parseFloat(data.cost)}
      )
    `
    return { success: true }
  } catch (error) {
    console.error("Error adding product:", error)
    throw new Error("Failed to add product")
  }
}

export async function addOrder(data: {
  customerId: string
  orderDate: string
  status: string
  totalAmount: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
  }>
}) {
  try {
    // Start a transaction
    await sql`BEGIN`

    // Insert order
    const orderResult = await sql`
      INSERT INTO orders (customer_id, order_date, status, total_amount)
      VALUES (
        ${Number.parseInt(data.customerId)}, 
        ${data.orderDate}, 
        ${data.status}, 
        ${Number.parseFloat(data.totalAmount)}
      )
      RETURNING id
    `

    const orderId = orderResult[0].id

    // Insert order items
    for (const item of data.items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, qty, unit_price)
        VALUES (
          ${orderId}, 
          ${Number.parseInt(item.productId)}, 
          ${item.quantity}, 
          ${item.unitPrice}
        )
      `
    }

    // Commit transaction
    await sql`COMMIT`

    return { success: true, orderId }
  } catch (error) {
    // Rollback on error
    await sql`ROLLBACK`
    console.error("Error adding order:", error)
    throw new Error("Failed to add order")
  }
}
