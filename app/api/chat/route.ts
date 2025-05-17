import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"
import { generateSqlFallback } from "@/lib/sql-fallback"

export const runtime = "nodejs"

// Helper function to clean SQL query from markdown formatting
function cleanSqlQuery(query: string): string {
  // Remove markdown code block markers
  let cleaned = query.replace(/```sql/gi, "").replace(/```/g, "")

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim()

  // If the query starts with "SELECT", "WITH", "INSERT", "UPDATE", "DELETE", etc., it's probably valid SQL
  // Otherwise, it might be an explanation or other text, so use the fallback
  const validSqlStart = /^(SELECT|WITH|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)/i
  if (!validSqlStart.test(cleaned)) {
    console.warn("Query doesn't appear to be valid SQL:", cleaned)
    return ""
  }

  return cleaned
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1].content

    let sqlQuery = ""
    let usedFallback = false
    let explanation = ""

    try {
      // Step 1: Try to generate SQL from the natural language query using Gemini
      const { text } = await generateText({
        model: google("gemini-1.5-flash"), // Use a lighter model with higher quotas
        system: `You are an expert SQL analyst. Your task is to convert natural language questions about business data into SQL queries.
        
        The database has the following schema:
        - customers (id, name, email, sgmt, created_at, region_id)
        - orders (id, customer_id, order_date, status, total_amount)
        - order_items (id, order_id, product_id, qty, unit_price)
        - products (id, p_name, category, subcategory, price, cost)
        - regions (id, name, country)
        
        Some tables and columns have poor naming conventions. For example:
        - The 'customers' table has a column 'sgmt' which means 'segment'
        - The 'products' table has a column 'p_name' instead of 'name'
        - The 'order_items' table has a column 'qty' instead of 'quantity'
        
        Generate only the SQL query without any explanation or markdown formatting. Do not include \`\`\` or sql tags. Make sure the query is valid PostgreSQL.`,
        prompt: lastMessage,
        maxTokens: 500, // Limit token usage
      })

      // Clean the SQL query from any markdown formatting
      sqlQuery = cleanSqlQuery(text)

      // If cleaning resulted in an empty query, use fallback
      if (!sqlQuery) {
        console.warn("Cleaned SQL query was empty, using fallback")
        sqlQuery = generateSqlFallback(lastMessage)
        usedFallback = true
        explanation = "I'm using a simplified analysis mode. Here are the results based on your query."
      }
    } catch (error) {
      console.error("Gemini API error:", error)
      // Fallback to rule-based SQL generation
      sqlQuery = generateSqlFallback(lastMessage)
      usedFallback = true
      explanation =
        "I'm using a simplified analysis mode due to AI service limitations. Here are the results based on your query."
    }

    // Step 2: Execute the SQL query
    let queryResults
    try {
      queryResults = await executeQuery(sqlQuery)
    } catch (error) {
      console.error("SQL execution error:", error)

      // Try with fallback SQL if the original query failed
      if (!usedFallback) {
        sqlQuery = generateSqlFallback(lastMessage)
        usedFallback = true
        explanation = "I couldn't execute the initial query, so I'm using a simplified approach. Here are the results:"

        try {
          queryResults = await executeQuery(sqlQuery)
        } catch (secondError) {
          console.error("Fallback SQL execution error:", secondError)
          return new Response(
            JSON.stringify({
              role: "assistant",
              content: JSON.stringify({
                explanation:
                  "I couldn't execute that query. There might be an issue with the SQL syntax or the requested data.",
                sql: sqlQuery,
                error: secondError instanceof Error ? secondError.message : "Unknown error",
              }),
            }),
            {
              headers: {
                "Content-Type": "application/json",
              },
            },
          )
        }
      } else {
        return new Response(
          JSON.stringify({
            role: "assistant",
            content: JSON.stringify({
              explanation:
                "I couldn't execute that query. There might be an issue with the SQL syntax or the requested data.",
              sql: sqlQuery,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
      }
    }

    // Make sure queryResults has the expected structure
    if (!queryResults || !queryResults.fields || !queryResults.rows) {
      queryResults = {
        fields: [],
        rows: [],
      }
    }

    // Step 3: Analyze the results and determine the best visualization
    const columns = queryResults.fields.map((field: any) => field.name)
    const rows = queryResults.rows

    // Try to analyze the results with Gemini if we haven't already used the fallback
    let visualization = null

    if (!usedFallback && explanation === "") {
      try {
        const { text: analysisText } = await generateText({
          model: google("gemini-1.5-flash"), // Use a lighter model with higher quotas
          prompt: `Analyze these SQL query results and provide a brief explanation:
            
            User question: ${lastMessage}
            SQL query: ${sqlQuery}
            
            Results:
            Columns: ${JSON.stringify(columns)}
            Sample rows: ${JSON.stringify(rows.slice(0, 3))}
            Total rows: ${rows.length}
            
            Keep your explanation concise and focused on the data insights. Do not include any markdown formatting.`,
          maxTokens: 300, // Limit token usage
        })

        explanation = analysisText
      } catch (error) {
        console.error("Analysis error:", error)
        // Fallback explanation
        explanation = "Here are the results of your query."

        // Simple result summary
        if (rows.length === 0) {
          explanation = "No data found for your query."
        } else if (rows.length === 1 && columns.length === 1) {
          explanation = `The result is ${rows[0][columns[0]]}.`
        } else {
          explanation += ` Found ${rows.length} results.`
        }
      }
    }

    // Always determine visualization type based on data structure
    visualization = determineVisualizationType(columns, rows)

    // Step 4: Return the results
    return NextResponse.json({
      role: "assistant",
      content: JSON.stringify({
        explanation: explanation,
        sql: sqlQuery,
        data: {
          columns: columns,
          rows: rows,
        },
        visualization: visualization,
      }),
    })
  } catch (error) {
    console.error("Error processing chat request:", error)
    return NextResponse.json(
      {
        role: "assistant",
        content:
          "I encountered an error while processing your request. Please try a different question or check the database connection.",
      },
      { status: 200 },
    )
  }
}

function determineVisualizationType(columns: string[], rows: any[]) {
  if (rows.length === 0 || columns.length === 0) return null

  // Check if there are date/time columns for time series
  const dateColumns = columns.filter(
    (col) => col.includes("date") || col.includes("time") || col.includes("month") || col.includes("year"),
  )

  // Check if there are numeric columns
  const numericColumns = columns.filter((col) => {
    if (rows.length === 0) return false
    const sampleValue = rows[0][col]
    return typeof sampleValue === "number" || !isNaN(Number(sampleValue))
  })

  // Check if there are categorical columns
  const categoricalColumns = columns.filter((col) => !dateColumns.includes(col) && !numericColumns.includes(col))

  if (dateColumns.length > 0 && numericColumns.length > 0) {
    // Time series data - use line chart
    return {
      type: "line",
      config: {
        xAxis: dateColumns[0],
        yAxis: numericColumns[0],
        title: "Time Series Analysis",
      },
    }
  } else if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    // Categorical data - use bar chart
    return {
      type: "bar",
      config: {
        xAxis: categoricalColumns[0],
        yAxis: numericColumns[0],
        title: "Categorical Analysis",
      },
    }
  } else if (categoricalColumns.length > 0 && rows.length <= 10) {
    // Small categorical dataset - use pie chart
    return {
      type: "pie",
      config: {
        categoryField: categoricalColumns[0],
        valueField: numericColumns.length > 0 ? numericColumns[0] : "count",
        title: "Distribution Analysis",
      },
    }
  }

  // Default to bar chart if we have at least 2 columns
  if (columns.length >= 2) {
    return {
      type: "bar",
      config: {
        xAxis: columns[0],
        yAxis: columns[1],
        title: "Data Analysis",
      },
    }
  }

  // No suitable visualization
  return null
}
