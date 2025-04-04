"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createVenue, updateVenue } from "@/lib/actions/admin-actions"

type VenueType = {
  id: string
  name: string
}

type Venue = {
  id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  capacity: number
  venue_type_id: string
  image_url: string | null
  is_active: boolean
}

export function VenueForm({ venue }: { venue?: Venue }) {
  const router = useRouter()
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    capacity: 0,
    venue_type_id: "",
    image_url: "",
    is_active: true,
  })

  useEffect(() => {
    // Fetch venue types
    async function fetchVenueTypes() {
      const { data, error } = await supabase.from("venue_types").select("id, name").order("name")

      if (error) {
        console.error("Error fetching venue types:", error)
        return
      }

      setVenueTypes(data || [])
    }

    fetchVenueTypes()

    // If editing, populate form with venue data
    if (venue) {
      setFormData({
        name: venue.name,
        description: venue.description || "",
        address: venue.address,
        city: venue.city,
        state: venue.state,
        zip_code: venue.zip_code,
        capacity: venue.capacity,
        venue_type_id: venue.venue_type_id,
        image_url: venue.image_url || "",
        is_active: venue.is_active,
      })
    }
  }, [venue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: Number.parseInt(value) || 0 }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const formDataObj = new FormData()

      // Add all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "is_active") {
          formDataObj.append(key, value ? "true" : "false")
        } else {
          formDataObj.append(key, value.toString())
        }
      })

      if (venue) {
        // Update existing venue
        const result = await updateVenue(venue.id, formDataObj)

        if (result.error) {
          throw new Error(result.error)
        }
      } else {
        // Create new venue
        const result = await createVenue(formDataObj)

        if (result.error) {
          throw new Error(result.error)
        }
      }

      setSuccess(true)

      // Redirect after successful submission
      setTimeout(() => {
        router.push("/admin/venues")
        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error("Error saving venue:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>}
      {success && <div className="bg-green-50 p-4 rounded-md text-green-800">Venue saved successfully!</div>}

      <div className="space-y-2">
        <Label htmlFor="name">Venue Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g. AT&T Stadium"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe the venue..."
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder="Street Address"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            placeholder="State"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip_code">ZIP Code</Label>
          <Input
            id="zip_code"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleInputChange}
            placeholder="ZIP Code"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="venue_type_id">Venue Type</Label>
          <Select value={formData.venue_type_id} onValueChange={(value) => handleSelectChange("venue_type_id", value)}>
            <SelectTrigger id="venue_type_id">
              <SelectValue placeholder="Select venue type" />
            </SelectTrigger>
            <SelectContent>
              {venueTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min="0"
            value={formData.capacity}
            onChange={handleNumberChange}
            placeholder="Venue capacity"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          name="image_url"
          value={formData.image_url}
          onChange={handleInputChange}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleCheckboxChange("is_active", checked as boolean)}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : venue ? "Update Venue" : "Create Venue"}
      </Button>
    </form>
  )
}

