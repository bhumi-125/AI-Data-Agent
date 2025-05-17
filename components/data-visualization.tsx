"use client"

import { Card } from "@/components/ui/card"
import {
  Bar,
  BarChart as RechartsBarChart,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart as RechartsAreaChart,
} from "recharts"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BarChart, LineChart, PieChart } from "lucide-react"

interface DataVisualizationProps {
  type: "bar" | "line" | "pie" | "area"
  data: {
    columns: string[]
    rows: any[]
  }
  config: {
    xAxis?: string
    yAxis?: string | string[]
    categoryField?: string
    valueField?: string
    title?: string
  }
}

export function DataVisualization({ type: initialType, data, config }: DataVisualizationProps) {
  const [type, setType] = useState(initialType)

  if (!data || !data.rows || data.rows.length === 0) {
    return null
  }

  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088fe",
    "#00c49f",
    "#ffbb28",
    "#ff8042",
    "#a4de6c",
    "#d0ed57",
  ]

  // Determine if we can switch between chart types
  const hasTimeData = data.columns.some(
    (col) => col.includes("date") || col.includes("time") || col.includes("month") || col.includes("year"),
  )
  const hasCategoricalData = data.columns.some(
    (col) =>
      !col.includes("date") &&
      !col.includes("time") &&
      !col.includes("month") &&
      !col.includes("year") &&
      typeof data.rows[0][col] === "string",
  )
  const hasNumericData = data.columns.some((col) => {
    const sampleValue = data.rows[0][col]
    return typeof sampleValue === "number" || !isNaN(Number(sampleValue))
  })

  const canShowBar = hasCategoricalData && hasNumericData
  const canShowLine = hasTimeData && hasNumericData
  const canShowPie = hasCategoricalData && hasNumericData && data.rows.length <= 10
  const canShowArea = hasTimeData && hasNumericData

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={data.rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              {Array.isArray(config.yAxis) ? (
                config.yAxis.map((axis, index) => (
                  <Bar key={axis} dataKey={axis} fill={COLORS[index % COLORS.length]} />
                ))
              ) : (
                <Bar dataKey={config.yAxis} fill="#8884d8" />
              )}
            </RechartsBarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={data.rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              {Array.isArray(config.yAxis) ? (
                config.yAxis.map((axis, index) => (
                  <Line key={axis} type="monotone" dataKey={axis} stroke={COLORS[index % COLORS.length]} />
                ))
              ) : (
                <Line type="monotone" dataKey={config.yAxis} stroke="#8884d8" />
              )}
            </RechartsLineChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsAreaChart data={data.rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              {Array.isArray(config.yAxis) ? (
                config.yAxis.map((axis, index) => (
                  <Area
                    key={axis}
                    type="monotone"
                    dataKey={axis}
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.3}
                  />
                ))
              ) : (
                <Area type="monotone" dataKey={config.yAxis} stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              )}
            </RechartsAreaChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={data.rows}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={config.valueField}
                nameKey={config.categoryField}
              >
                {data.rows.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        {config.title && <h3 className="text-lg font-medium">{config.title}</h3>}
        <div className="flex space-x-2">
          {canShowBar && (
            <Button
              variant={type === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setType("bar")}
              title="Bar Chart"
            >
              <BarChart className="h-4 w-4" />
            </Button>
          )}
          {canShowLine && (
            <Button
              variant={type === "line" ? "default" : "outline"}
              size="sm"
              onClick={() => setType("line")}
              title="Line Chart"
            >
              <LineChart className="h-4 w-4" />
            </Button>
          )}
          {canShowPie && (
            <Button
              variant={type === "pie" ? "default" : "outline"}
              size="sm"
              onClick={() => setType("pie")}
              title="Pie Chart"
            >
              <PieChart className="h-4 w-4" />
            </Button>
          )}
          {canShowArea && (
            <Button
              variant={type === "area" ? "default" : "outline"}
              size="sm"
              onClick={() => setType("area")}
              title="Area Chart"
            >
              <LineChart className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {renderChart()}
    </Card>
  )
}
