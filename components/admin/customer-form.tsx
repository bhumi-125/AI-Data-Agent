"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addCustomer } from "@/lib/admin-actions"
import { toast } from "@/components/ui/use-toast"

export function CustomerForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    segment: "",
    regionId: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await addCustomer(formData)
      toast({
        title: "Success",
        description: "Customer added successfully",
      })
      setFormData({
        name: "",
        email: "",
        segment: "",
        regionId: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add customer",
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
        <Label htmlFor="name">Company Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="segment">Segment</Label>
        <Select value={formData.segment} onValueChange={(value) => handleSelectChange("segment", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
            <SelectItem value="SMB">SMB</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="regionId">Region</Label>
        <Select value={formData.regionId} onValueChange={(value) => handleSelectChange("regionId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Northeast</SelectItem>
            <SelectItem value="2">Southeast</SelectItem>
            <SelectItem value="3">Midwest</SelectItem>
            <SelectItem value="4">West</SelectItem>
            <SelectItem value="5">Central (Canada)</SelectItem>
            <SelectItem value="6">Eastern (Canada)</SelectItem>
            <SelectItem value="7">Western (Canada)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Adding..." : "Add Customer"}
      </Button>
    </form>
  )
}
