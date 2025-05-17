import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function analyzeQueryResults(queryResults: any, userQuestion: string, sqlQuery: string) {
  if (!queryResults || !queryResults.fields || !queryResults.rows) {
    throw new Error("Invalid query results")
  }

  // Extract columns and rows from query results
  const columns = queryResults.fields.map((field: any) => field.name)
  const rows = queryResults.rows

  try {
    // Use Gemini to analyze the results and determine the best visualization
    const analysisPrompt = `
      You are an expert data analyst. Analyze these SQL query results and provide insights.
      
      User question: ${userQuestion}
      SQL query: ${sqlQuery}
      
      Results:
      Columns: ${JSON.stringify(columns)}
      Sample rows: ${JSON.stringify(rows.slice(0, 3))}
      Total rows: ${rows.length}
      
      Provide your analysis in JSON format with this structure:
      {
        "explanation": "Your natural language explanation of the results",
        "visualization": {
          "type": "bar|line|pie",
          "config": {
            // For bar/line charts:
            "xAxis": "column_name",
            "yAxis": "column_name" or ["column1", "column2"],
            "title": "Chart title"
            
            // For pie charts:
            "categoryField": "column_name",
            "valueField": "column_name",
            "title": "Chart title"
          }
        }
      }
      
      Only include visualization if the data is appropriate for visualization.
    `

    const { text: analysisJson } = await generateText({
      model: google("gemini-1.5-pro"),
      prompt: analysisPrompt,
    })

    try {
      const analysis = JSON.parse(analysisJson)
      return {
        explanation: analysis.explanation,
        columns,
        rows,
        visualization: analysis.visualization,
      }
    } catch (jsonError) {
      console.error("Error parsing JSON from Gemini:", jsonError)
      // If JSON parsing fails, use the text as explanation and determine visualization ourselves
      return {
        explanation: analysisJson,
        columns,
        rows,
        visualization: determineVisualizationType(columns, rows),
      }
    }
  } catch (error) {
    console.error("Error analyzing results:", error)

    // Fallback analysis without AI
    let explanation = "Here are the results of your query."

    // Simple result summary
    if (rows.length === 0) {
      explanation = "No data found for your query."
    } else if (rows.length === 1 && columns.length === 1) {
      explanation = `The result is ${rows[0][columns[0]]}.`
    } else {
      explanation = `Found ${rows.length} results for your query.`
    }

    // Determine visualization type based on data structure
    const visualization = determineVisualizationType(columns, rows)

    return {
      explanation,
      columns,
      rows,
      visualization,
    }
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
