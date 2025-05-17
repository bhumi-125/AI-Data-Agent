"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addOrder } from "@/lib/admin-actions"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"

export function OrderForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])

  const [formData, setFormData] = useState({
    customerId: "",
    orderDate: new Date().toISOString().split("T")[0],
    status: "Completed",
    items: [{ productId: "", quantity: 1, unitPrice: 0 }],
  })

  useEffect(() => {
    // Fetch customers and products
    const fetchData = async () => {
      try {
        const customersRes = await fetch("/api/admin/customers")
        const productsRes = await fetch("/api/admin/products")

        if (customersRes.ok && productsRes.ok) {
          const customersData = await customersRes.json()
          const productsData = await productsRes.json()

          setCustomers(customersData)
          setProducts(productsData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }

    // If product changed, update unit price
    if (field === "productId") {
      const product = products.find((p) => p.id === Number.parseInt(value))
      if (product) {
        newItems[index].unitPrice = product.price
      }
    }

    setFormData((prev) => ({ ...prev, items: newItems }))
  }

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: 1, unitPrice: 0 }],
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = [...formData.items]
      newItems.splice(index, 1)
      setFormData((prev) => ({ ...prev, items: newItems }))
    }
  }

  const calculateTotal = () => {
    return formData.items
      .reduce((total, item) => {
        return total + item.quantity * item.unitPrice
      }, 0)
      .toFixed(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const orderData = {
        ...formData,
        totalAmount: calculateTotal(),
      }

      await addOrder(orderData)
      toast({
        title: "Success",
        description: "Order created successfully",
      })
      setFormData({
        customerId: "",
        orderDate: new Date().toISOString().split("T")[0],
        status: "Completed",
        items: [{ productId: "", quantity: 1, unitPrice: 0 }],
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="customerId">Customer</Label>
        <Select value={formData.customerId} onValueChange={(value) => handleSelectChange("customerId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer: any) => (
              <SelectItem key={customer.id} value={customer.id.toString()}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="orderDate">Order Date</Label>
        <Input
          id="orderDate"
          name="orderDate"
          type="date"
          value={formData.orderDate}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Order Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>

        {formData.items.map((item, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-5">
                  <Label htmlFor={`product-${index}`}>Product</Label>
                  <Select
                    value={item.productId.toString()}
                    onValueChange={(value) => handleItemChange(index, "productId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.p_name} - ${product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-3">
                  <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", Number.parseInt(e.target.value))}
                    required
                  />
                </div>

                <div className="col-span-3">
                  <Label htmlFor={`price-${index}`}>Unit Price</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, "unitPrice", Number.parseFloat(e.target.value))}
                    required
                  />
                </div>

                <div className="col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-right text-lg font-semibold">Total: ${calculateTotal()}</div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Order"}
      </Button>
    </form>
  )
}
