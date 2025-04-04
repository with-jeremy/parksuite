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
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUploader } from "@/components/host/image-uploader"

type Amenity = {
  id: string
  name: string
}

type ParkingSpot = {
  id: string
  title: string
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  type: string
  price_per_day: number
  spaces_available: number
  is_active: boolean
  parking_spot_amenities: { amenity_id: string }[]
}

export function ListingForm({ listing }: { listing?: ParkingSpot }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    type: "driveway",
    price_per_day: 0,
    spaces_available: 1,
    is_active: true,
  })

  useEffect(() => {
    // Fetch amenities
    async function fetchAmenities() {
      const { data, error } = await supabase.from("amenities").select("id, name").order("name")

      if (error) {
        console.error("Error fetching amenities:", error)
        return
      }

      setAmenities(data || [])
    }

    fetchAmenities()

    // If editing, populate form with listing data
    if (listing) {
      setFormData({
        title: listing.title,
        description: listing.description || "",
        address: listing.address,
        city: listing.city,
        state: listing.state,
        zip_code: listing.zip_code,
        type: listing.type,
        price_per_day: listing.price_per_day,
        spaces_available: listing.spaces_available,
        is_active: listing.is_active,
      })

      // Set selected amenities
      if (listing.parking_spot_amenities) {
        setSelectedAmenities(listing.parking_spot_amenities.map((a) => a.amenity_id))
      }
    }
  }, [listing])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: Number.parseFloat(value) || 0 }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleAmenityToggle = (amenityId: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities((prev) => [...prev, amenityId])
    } else {
      setSelectedAmenities((prev) => prev.filter((id) => id !== amenityId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      let parkingSpotId = listing?.id

      if (listing) {
        // Update existing listing
        const { error } = await supabase
          .from("parking_spots")
          .update({
            title: formData.title,
            description: formData.description,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip_code,
            type: formData.type,
            price_per_day: formData.price_per_day,
            spaces_available: formData.spaces_available,
            is_active: formData.is_active,
          })
          .eq("id", listing.id)

        if (error) throw error
      } else {
        // Create new listing
        const { data, error } = await supabase
          .from("parking_spots")
          .insert({
            owner_id: user.id,
            title: formData.title,
            description: formData.description,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip_code,
            type: formData.type,
            price_per_day: formData.price_per_day,
            spaces_available: formData.spaces_available,
            is_active: formData.is_active,
          })
          .select("id")
          .single()

        if (error) throw error
        parkingSpotId = data.id
      }

      // Handle amenities
      if (parkingSpotId) {
        // First, remove existing amenities if editing
        if (listing) {
          await supabase.from("parking_spot_amenities").delete().eq("parking_spot_id", parkingSpotId)
        }

        // Add selected amenities
        if (selectedAmenities.length > 0) {
          const amenityRecords = selectedAmenities.map((amenityId) => ({
            parking_spot_id: parkingSpotId,
            amenity_id: amenityId,
          }))

          const { error } = await supabase.from("parking_spot_amenities").insert(amenityRecords)

          if (error) throw error
        }
      }

      setSuccess(true)

      // Redirect to dashboard after successful submission
      setTimeout(() => {
        router.push("/host/dashboard")
        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error("Error saving listing:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const nextTab = () => {
    if (activeTab === "basic") setActiveTab("details")
    else if (activeTab === "details") setActiveTab("amenities")
    else if (activeTab === "amenities") setActiveTab("images")
  }

  const prevTab = () => {
    if (activeTab === "images") setActiveTab("amenities")
    else if (activeTab === "amenities") setActiveTab("details")
    else if (activeTab === "details") setActiveTab("basic")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>}
      {success && <div className="bg-green-50 p-4 rounded-md text-green-800">Listing saved successfully!</div>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Listing Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Private Driveway Near Stadium"
              required
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
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
                required
              />
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

          <div className="flex justify-end">
            <Button type="button" onClick={nextTab}>
              Next: Details
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your parking space..."
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Parking Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select parking type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driveway">Driveway</SelectItem>
                  <SelectItem value="garage">Garage</SelectItem>
                  <SelectItem value="lot">Parking Lot</SelectItem>
                  <SelectItem value="street">Street Parking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spaces_available">Number of Spaces</Label>
              <Input
                id="spaces_available"
                name="spaces_available"
                type="number"
                min="1"
                value={formData.spaces_available}
                onChange={handleNumberChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_per_day">Price per Day ($)</Label>
            <Input
              id="price_per_day"
              name="price_per_day"
              type="number"
              min="0"
              step="0.01"
              value={formData.price_per_day}
              onChange={handleNumberChange}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleCheckboxChange("is_active", checked as boolean)}
            />
            <Label htmlFor="is_active">List as active and available for booking</Label>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={prevTab}>
              Back: Basic Info
            </Button>
            <Button type="button" onClick={nextTab}>
              Next: Amenities
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="amenities" className="space-y-6">
          <div className="space-y-4">
            <Label>Amenities</Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {amenities.map((amenity) => (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity.id}`}
                    checked={selectedAmenities.includes(amenity.id)}
                    onCheckedChange={(checked) => handleAmenityToggle(amenity.id, checked as boolean)}
                  />
                  <Label
                    htmlFor={`amenity-${amenity.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {amenity.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={prevTab}>
              Back: Details
            </Button>
            <Button type="button" onClick={nextTab}>
              Next: Images
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="images" className="space-y-6">
          <div className="space-y-4">
            <Label>Parking Spot Images</Label>
            <p className="text-sm text-muted-foreground">
              Upload clear photos of your parking space. Good photos increase bookings!
            </p>

            {listing ? (
              <ImageUploader parkingSpotId={listing.id} />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    You'll be able to add images after creating your listing.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={prevTab}>
              Back: Amenities
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : listing ? "Update Listing" : "Create Listing"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  )
}

