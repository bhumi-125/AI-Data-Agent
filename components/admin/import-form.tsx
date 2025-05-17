"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Upload } from "lucide-react"

export function ImportForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [type, setType] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!type || !file) {
      toast({
        title: "Error",
        description: "Please select a file type and upload a CSV file",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const response = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        })
        setFile(null)
        setType("")

        // Reset file input
        const fileInput = document.getElementById("csv-file") as HTMLInputElement
        if (fileInput) {
          fileInput.value = ""
        }
      } else {
        throw new Error(data.error || "Failed to import data")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Data</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="import-type">Data Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select data type to import" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <div className="flex items-center gap-2">
              <input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("csv-file")?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {file ? file.name : "Choose CSV file"}
              </Button>
            </div>
            {type && (
              <div className="text-sm text-muted-foreground mt-2">
                <p className="font-medium">Expected CSV format for {type}:</p>
                {type === "customers" && <p>name,email,segment,region_id</p>}
                {type === "products" && <p>name,category,subcategory,price,cost</p>}
                {type === "orders" && <p>order_id,customer_id,order_date,status,product_id,quantity,unit_price</p>}
              </div>
            )}
          </div>

          <Button type="submit" disabled={isLoading || !file || !type}>
            {isLoading ? "Importing..." : "Import Data"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
