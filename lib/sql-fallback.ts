// Enhanced rule-based SQL generator for when AI API is unavailable

export function generateSqlFallback(question: string): string {
  question = question.toLowerCase()

  // Common patterns and their corresponding SQL queries

  // Total sales
  if (question.includes("total sales") || question.includes("revenue")) {
    return `SELECT SUM(total_amount) as total_sales FROM orders WHERE status = 'Completed'`
  }

  // Sales by category
  if (question.includes("sales by category") || question.includes("revenue by category")) {
    return `
      SELECT 
        p.category, 
        SUM(oi.qty * oi.unit_price) as total_sales
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'Completed'
      GROUP BY p.category
      ORDER BY total_sales DESC
    `
  }

  // Top customers
  if (question.includes("top customer") || question.includes("best customer")) {
    return `
      SELECT 
        c.name, 
        SUM(o.total_amount) as total_spent
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      WHERE o.status = 'Completed'
      GROUP BY c.name
      ORDER BY total_spent DESC
      LIMIT 10
    `
  }

  // Sales by month
  if (question.includes("sales by month") || question.includes("monthly sales")) {
    return `
      SELECT 
        TO_CHAR(order_date, 'YYYY-MM') as month,
        SUM(total_amount) as monthly_sales
      FROM orders
      WHERE status = 'Completed'
      GROUP BY TO_CHAR(order_date, 'YYYY-MM')
      ORDER BY month
    `
  }

  // Compare segments
  if (question.includes("segment") || question.includes("compare segments")) {
    return `
      SELECT 
        c.sgmt as segment,
        COUNT(DISTINCT c.id) as customer_count,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_sales,
        CASE 
          WHEN COUNT(o.id) > 0 
          THEN SUM(o.total_amount) / COUNT(o.id) 
          ELSE 0 
        END as avg_order_value
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.status = 'Completed'
      GROUP BY c.sgmt
      ORDER BY total_sales DESC
    `
  }

  // Product performance
  if (question.includes("product") || question.includes("best selling")) {
    return `
      SELECT 
        p.p_name as product_name,
        p.category,
        SUM(oi.qty) as quantity_sold,
        SUM(oi.qty * oi.unit_price) as total_sales
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'Completed'
      GROUP BY p.id, p.p_name, p.category
      ORDER BY quantity_sold DESC
      LIMIT 10
    `
  }

  // Regional sales
  if (question.includes("region") || question.includes("country")) {
    return `
      SELECT 
        r.name as region,
        r.country,
        COUNT(DISTINCT c.id) as customer_count,
        SUM(o.total_amount) as total_sales
      FROM regions r
      LEFT JOIN customers c ON r.id = c.region_id
      LEFT JOIN orders o ON c.id = o.customer_id AND o.status = 'Completed'
      GROUP BY r.id, r.name, r.country
      ORDER BY total_sales DESC
    `
  }

  // Profit margin
  if (question.includes("profit") || question.includes("margin")) {
    return `
      SELECT 
        p.p_name as product_name,
        p.category,
        p.price,
        p.cost,
        (p.price - p.cost) as profit_per_unit,
        ((p.price - p.cost) / p.price * 100) as margin_percentage
      FROM products p
      ORDER BY margin_percentage DESC
    `
  }

  // Recent orders
  if (question.includes("recent") || question.includes("latest")) {
    return `
      SELECT 
        o.id as order_id,
        c.name as customer,
        o.order_date,
        o.status,
        o.total_amount
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.order_date DESC
      LIMIT 10
    `
  }

  // Sales trends
  if (question.includes("trend") || question.includes("over time")) {
    return `
      SELECT 
        TO_CHAR(order_date, 'YYYY-MM') as month,
        SUM(total_amount) as monthly_sales,
        COUNT(id) as order_count
      FROM orders
      WHERE status = 'Completed'
      GROUP BY TO_CHAR(order_date, 'YYYY-MM')
      ORDER BY month
    `
  }

  // Customer order frequency
  if (question.includes("frequency") || question.includes("how often")) {
    return `
      SELECT 
        c.name as customer,
        COUNT(o.id) as order_count,
        MIN(o.order_date) as first_order,
        MAX(o.order_date) as last_order,
        (MAX(o.order_date) - MIN(o.order_date)) / COUNT(o.id) as avg_days_between_orders
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      WHERE o.status = 'Completed'
      GROUP BY c.id, c.name
      HAVING COUNT(o.id) > 1
      ORDER BY order_count DESC
      LIMIT 10
    `
  }

  // Average order value
  if (question.includes("average order") || question.includes("avg order")) {
    return `
      SELECT 
        AVG(total_amount) as avg_order_value,
        MIN(total_amount) as min_order_value,
        MAX(total_amount) as max_order_value
      FROM orders
      WHERE status = 'Completed'
    `
  }

  // Product categories comparison
  if (question.includes("compare categories") || question.includes("category comparison")) {
    return `
      SELECT 
        p.category,
        COUNT(DISTINCT p.id) as product_count,
        COUNT(DISTINCT oi.order_id) as order_count,
        SUM(oi.qty) as total_quantity_sold,
        SUM(oi.qty * oi.unit_price) as total_sales,
        AVG(p.price) as avg_price,
        AVG(p.price - p.cost) as avg_profit_per_unit
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'Completed'
      GROUP BY p.category
      ORDER BY total_sales DESC
    `
  }

  // Default query - show recent orders
  return `
    SELECT 
      o.id as order_id,
      c.name as customer,
      o.order_date,
      o.total_amount
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    ORDER BY o.order_date DESC
    LIMIT 10
  `
}
