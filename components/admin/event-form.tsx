"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { createEvent, updateEvent } from "@/lib/actions/admin-actions"

type EventType = {
  id: string
  name: string
}

type Venue = {
  id: string
  name: string
  city: string
  state: string
}

type Event = {
  id: string
  name: string
  description: string
  date: string
  start_time: string
  end_time: string
  venue_id: string
  event_type_id: string
  image_url: string | null
  is_active: boolean
}

export function EventForm({ event }: { event?: Event }) {
  const router = useRouter()
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [date, setDate] = useState<Date | undefined>(event ? new Date(event.date) : undefined)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_time: "",
    end_time: "",
    venue_id: "",
    event_type_id: "",
    image_url: "",
    is_active: true,
  })

  useEffect(() => {
    // Fetch event types and venues
    async function fetchData() {
      const [eventTypesResponse, venuesResponse] = await Promise.all([
        supabase.from("event_types").select("id, name").order("name"),
        supabase.from("venues").select("id, name, city, state").order("name"),
      ])

      if (eventTypesResponse.error) {
        console.error("Error fetching event types:", eventTypesResponse.error)
      } else {
        setEventTypes(eventTypesResponse.data || [])
      }

      if (venuesResponse.error) {
        console.error("Error fetching venues:", venuesResponse.error)
      } else {
        setVenues(venuesResponse.data || [])
      }
    }

    fetchData()

    // If editing, populate form with event data
    if (event) {
      setFormData({
        name: event.name,
        description: event.description || "",
        start_time: event.start_time,
        end_time: event.end_time,
        venue_id: event.venue_id,
        event_type_id: event.event_type_id,
        image_url: event.image_url || "",
        is_active: event.is_active,
      })
    }
  }, [event])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date) {
      setError("Please select a date")
      return
    }

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

      // Add date
      formDataObj.append("date", format(date, "yyyy-MM-dd"))

      if (event) {
        // Update existing event
        const result = await updateEvent(event.id, formDataObj)

        if (result.error) {
          throw new Error(result.error)
        }
      } else {
        // Create new event
        const result = await createEvent(formDataObj)

        if (result.error) {
          throw new Error(result.error)
        }
      }

      setSuccess(true)

      // Redirect after successful submission
      setTimeout(() => {
        router.push("/admin/events")
        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error("Error saving event:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>}
      {success && <div className="bg-green-50 p-4 rounded-md text-green-800">Event saved successfully!</div>}

      <div className="space-y-2">
        <Label htmlFor="name">Event Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g. Cowboys vs Eagles"
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
          placeholder="Describe the event..."
          className="min-h-[120px]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="venue_id">Venue</Label>
          <Select value={formData.venue_id} onValueChange={(value) => handleSelectChange("venue_id", value)}>
            <SelectTrigger id="venue_id">
              <SelectValue placeholder="Select venue" />
            </SelectTrigger>
            <SelectContent>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.name} - {venue.city}, {venue.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_type_id">Event Type</Label>
          <Select value={formData.event_type_id} onValueChange={(value) => handleSelectChange("event_type_id", value)}>
            <SelectTrigger id="event_type_id">
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            name="start_time"
            type="time"
            value={formData.start_time}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            name="end_time"
            type="time"
            value={formData.end_time}
            onChange={handleInputChange}
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
        {loading ? "Saving..." : event ? "Update Event" : "Create Event"}
      </Button>
    </form>
  )
}

