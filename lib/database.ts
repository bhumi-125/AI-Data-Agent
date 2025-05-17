import { neon } from "@neondatabase/serverless"
import { LRUCache } from "lru-cache"

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL!)

// Initialize cache for query results
const queryCache = new LRUCache<string, any>({
  max: 100, // Maximum number of items to store in cache
  ttl: 1000 * 60 * 5, // Cache TTL: 5 minutes
})

export async function executeQuery(sqlQuery: string, useCache = true) {
  try {
    // Trim the SQL query to remove any leading/trailing whitespace
    const trimmedQuery = sqlQuery.trim()

    // Basic validation
    if (!trimmedQuery) {
      throw new Error("Empty SQL query")
    }

    // Check cache first if caching is enabled
    if (useCache) {
      const cachedResult = queryCache.get(trimmedQuery)
      if (cachedResult) {
        console.log("Cache hit for query:", trimmedQuery.substring(0, 50) + "...")
        return cachedResult
      }
    }

    // Execute the query
    const result = await sql.query(trimmedQuery)

    // Handle different result structures
    if (!result) {
      return {
        fields: [],
        rows: [],
      }
    }

    // Handle array results (some queries return arrays without fields property)
    if (Array.isArray(result)) {
      // If it's an array, we'll create a fields array from the keys of the first item
      if (result.length > 0) {
        const fields = Object.keys(result[0]).map((key) => ({ name: key }))
        const processedResult = { fields, rows: result }

        // Cache the result if caching is enabled
        if (useCache) {
          queryCache.set(trimmedQuery, processedResult)
        }

        return processedResult
      } else {
        return { fields: [], rows: [] }
      }
    }

    // Handle standard result object
    if (!result.fields) {
      result.fields = []
    }

    if (!result.rows) {
      result.rows = []
    }

    // Cache the result if caching is enabled
    if (useCache) {
      queryCache.set(trimmedQuery, result)
    }

    return result
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export async function getDatabaseSchema() {
  try {
    // Check cache first
    const cachedSchema = queryCache.get("database_schema")
    if (cachedSchema) {
      return cachedSchema
    }

    // Get tables
    const tablesQuery = `
      SELECT 
        table_name 
      FROM 
        information_schema.tables 
      WHERE 
        table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `
    const tablesResult = await sql.query(tablesQuery)

    if (!tablesResult || !tablesResult.rows || tablesResult.rows.length === 0) {
      return []
    }

    const schema = []

    // For each table, get columns and row count
    for (const table of tablesResult.rows) {
      const tableName = table.table_name

      // Get columns
      const columnsQuery = `
        SELECT 
          column_name, 
          data_type 
        FROM 
          information_schema.columns 
        WHERE 
          table_schema = 'public' AND 
          table_name = $1
      `
      const columnsResult = await sql.query(columnsQuery, [tableName])

      // Get row count
      const countQuery = `SELECT COUNT(*) FROM "${tableName}"`
      const countResult = await sql.query(countQuery)

      schema.push({
        name: tableName,
        columns: columnsResult.rows.map((col) => ({
          name: col.column_name,
          type: col.data_type,
        })),
        rowCount: Number.parseInt(countResult.rows[0].count),
      })
    }

    // Cache the schema
    queryCache.set("database_schema", schema, { ttl: 1000 * 60 * 30 }) // 30 minutes TTL for schema

    return schema
  } catch (error) {
    console.error("Error fetching database schema:", error)
    return []
  }
}

// Function to clear the cache
export function clearQueryCache() {
  queryCache.clear()
  return { success: true, message: "Query cache cleared" }
}
