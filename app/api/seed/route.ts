import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const runtime = "nodejs"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Check if tables already exist
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
      );
    `

    const alreadySeeded = tablesExist[0].exists

    if (alreadySeeded) {
      return NextResponse.json({ message: "Database already seeded" }, { status: 200 })
    }

    // Create tables one by one
    // Create regions table
    await sql`
      CREATE TABLE IF NOT EXISTS regions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL
      )
    `

    // Create customers table with foreign key
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        sgmt VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL
      )
    `

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        p_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        subcategory VARCHAR(100),
        price DECIMAL(10, 2) NOT NULL,
        cost DECIMAL(10, 2) NOT NULL
      )
    `

    // Create orders table with foreign key
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL
      )
    `

    // Create order_items table with foreign keys
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        qty INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL
      )
    `

    // Seed regions
    await sql`
      INSERT INTO regions (name, country)
      VALUES 
        ('Northeast', 'USA'),
        ('Southeast', 'USA'),
        ('Midwest', 'USA'),
        ('West', 'USA'),
        ('Central', 'Canada'),
        ('Eastern', 'Canada'),
        ('Western', 'Canada')
      ON CONFLICT DO NOTHING
    `

    // Seed customers
    await sql`
      INSERT INTO customers (name, email, sgmt, region_id)
      VALUES
        ('Acme Corp', 'contact@acmecorp.com', 'Enterprise', 1),
        ('Globex', 'info@globex.com', 'SMB', 2),
        ('Initech', 'support@initech.com', 'Enterprise', 3),
        ('Umbrella Corp', 'info@umbrellacorp.com', 'Enterprise', 4),
        ('Stark Industries', 'sales@stark.com', 'Enterprise', 1),
        ('Wayne Enterprises', 'info@wayne.com', 'Enterprise', 2),
        ('Cyberdyne Systems', 'info@cyberdyne.com', 'SMB', 3),
        ('Soylent Corp', 'contact@soylent.com', 'SMB', 4),
        ('Massive Dynamic', 'info@massive.com', 'Enterprise', 5),
        ('Oscorp', 'contact@oscorp.com', 'SMB', 6),
        ('LexCorp', 'info@lexcorp.com', 'Enterprise', 7),
        ('Weyland-Yutani', 'contact@weyland.com', 'Enterprise', 1),
        ('Tyrell Corp', 'info@tyrell.com', 'SMB', 2),
        ('Aperture Science', 'contact@aperture.com', 'SMB', 3),
        ('Rekall', 'info@rekall.com', 'SMB', 4)
      ON CONFLICT DO NOTHING
    `

    // Seed products
    await sql`
      INSERT INTO products (p_name, category, subcategory, price, cost)
      VALUES
        ('Advanced Server', 'Hardware', 'Servers', 5999.99, 3500.00),
        ('Basic Laptop', 'Hardware', 'Laptops', 899.99, 550.00),
        ('Premium Laptop', 'Hardware', 'Laptops', 1899.99, 1100.00),
        ('Standard Desktop', 'Hardware', 'Desktops', 799.99, 450.00),
        ('Gaming Desktop', 'Hardware', 'Desktops', 1599.99, 950.00),
        ('Enterprise Database', 'Software', 'Databases', 9999.99, 2000.00),
        ('Office Suite', 'Software', 'Productivity', 499.99, 100.00),
        ('Security Suite', 'Software', 'Security', 799.99, 150.00),
        ('Cloud Storage (1TB)', 'Services', 'Storage', 199.99, 50.00),
        ('Cloud Compute (Basic)', 'Services', 'Compute', 299.99, 75.00),
        ('Cloud Compute (Advanced)', 'Services', 'Compute', 999.99, 250.00),
        ('Managed Security', 'Services', 'Security', 1499.99, 400.00),
        ('Technical Support (Basic)', 'Services', 'Support', 499.99, 200.00),
        ('Technical Support (Premium)', 'Services', 'Support', 1999.99, 800.00),
        ('Consulting (per day)', 'Services', 'Consulting', 2499.99, 1000.00)
      ON CONFLICT DO NOTHING
    `

    // Seed first batch of orders
    await sql`
      INSERT INTO orders (customer_id, order_date, status, total_amount)
      VALUES
        (1, '2023-01-15', 'Completed', 12499.97),
        (1, '2023-02-20', 'Completed', 9999.99),
        (1, '2023-04-10', 'Completed', 4999.95),
        (2, '2023-01-22', 'Completed', 1699.98),
        (2, '2023-03-15', 'Completed', 799.99),
        (3, '2023-02-05', 'Completed', 17999.97),
        (3, '2023-05-12', 'Completed', 9999.99),
        (4, '2023-01-30', 'Completed', 3199.98),
        (4, '2023-03-22', 'Completed', 1499.99),
        (5, '2023-02-18', 'Completed', 11999.98),
        (6, '2023-04-05', 'Completed', 2699.98),
        (7, '2023-03-10', 'Completed', 799.99),
        (8, '2023-05-20', 'Completed', 1599.99),
        (9, '2023-01-25', 'Completed', 9999.99),
        (10, '2023-02-28', 'Completed', 899.99)
      ON CONFLICT DO NOTHING
    `

    // Seed first batch of order items
    await sql`
      INSERT INTO order_items (order_id, product_id, qty, unit_price)
      VALUES
        (1, 1, 2, 5999.99),
        (1, 7, 1, 499.99),
        (2, 6, 1, 9999.99),
        (3, 2, 5, 899.99),
        (4, 3, 1, 1899.99),
        (5, 8, 1, 799.99),
        (6, 1, 3, 5999.99),
        (7, 6, 1, 9999.99),
        (8, 5, 2, 1599.99),
        (9, 12, 1, 1499.99),
        (10, 1, 2, 5999.99),
        (11, 3, 1, 1899.99),
        (11, 7, 1, 799.99),
        (12, 8, 1, 799.99),
        (13, 5, 1, 1599.99),
        (14, 6, 1, 9999.99),
        (15, 2, 1, 899.99)
      ON CONFLICT DO NOTHING
    `

    // Seed second batch of orders
    await sql`
      INSERT INTO orders (customer_id, order_date, status, total_amount)
      VALUES
        (1, '2023-06-15', 'Completed', 8499.98),
        (2, '2023-06-22', 'Completed', 2699.98),
        (3, '2023-07-05', 'Completed', 11999.98),
        (4, '2023-07-12', 'Completed', 4999.95),
        (5, '2023-08-10', 'Completed', 9999.99),
        (6, '2023-08-18', 'Completed', 1699.98),
        (7, '2023-09-05', 'Completed', 1599.99),
        (8, '2023-09-15', 'Completed', 2999.97),
        (9, '2023-10-10', 'Completed', 7999.98),
        (10, '2023-10-22', 'Completed', 1699.98),
        (11, '2023-11-05', 'Completed', 9999.99),
        (12, '2023-11-18', 'Completed', 3199.98),
        (13, '2023-12-10', 'Completed', 5999.99),
        (14, '2023-12-20', 'Completed', 2699.98),
        (15, '2024-01-08', 'Completed', 4999.95)
      ON CONFLICT DO NOTHING
    `

    // Seed second batch of order items
    await sql`
      INSERT INTO order_items (order_id, product_id, qty, unit_price)
      VALUES
        (16, 3, 3, 1899.99),
        (16, 7, 1, 799.99),
        (17, 3, 1, 1899.99),
        (17, 7, 1, 799.99),
        (18, 1, 2, 5999.99),
        (19, 2, 5, 899.99),
        (19, 7, 1, 499.99),
        (20, 6, 1, 9999.99),
        (21, 3, 1, 1899.99),
        (22, 5, 1, 1599.99),
        (23, 9, 5, 199.99),
        (23, 7, 1, 499.99),
        (23, 8, 1, 799.99),
        (24, 1, 1, 5999.99),
        (24, 10, 1, 299.99),
        (24, 13, 1, 499.99),
        (25, 3, 1, 1899.99),
        (26, 6, 1, 9999.99),
        (27, 4, 4, 799.99),
        (28, 1, 1, 5999.99),
        (29, 2, 5, 899.99),
        (29, 7, 1, 499.99),
        (30, 3, 2, 1899.99)
      ON CONFLICT DO NOTHING
    `

    return NextResponse.json({ message: "Database seeded successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ error: "Failed to seed database", details: error }, { status: 500 })
  }
}
