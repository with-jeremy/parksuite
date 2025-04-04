"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/utils/supabase/client"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBooking } from "@/lib/actions/booking-actions"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookingFormProps, Availability, Event } from "@/types/supabase"

const supabase = createClient()

export function BookingForm({ parkingSpotId, price, isAuthenticated }: BookingFormProps) {
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [checkInTime, setCheckInTime] = useState<string>("09:00")
  const [checkOutTime, setCheckOutTime] = useState<string>("18:00")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [fetchingData, setFetchingData] = useState(true)

  // Calculate service fee and total
  const selectedDate = date ? format(date, "yyyy-MM-dd") : null
  const selectedAvailability = selectedDate ? availabilities.find((a) => a.date === selectedDate) : null

  const effectivePrice = selectedAvailability?.price_override ?? price
  const serviceFee = effectivePrice * 0.15
  const total = effectivePrice + serviceFee

  useEffect(() => {
    // Fetch availabilities and events
    async function fetchData() {
      try {
        setFetchingData(true)
        setError(null)

        const [availabilitiesResponse, eventsResponse] = await Promise.all([
          // Changed from "parking_spot_availability" to "availability"
          supabase
            .from("availability")
            .select("date, is_available, price_override")
            .eq("parking_spot_id", parkingSpotId),
          supabase
            .from("events")
            .select("id, name, date")
            .eq("is_active", true)
            .gte("date", new Date().toISOString().split("T")[0]),
        ])

        if (availabilitiesResponse.error) {
          console.error("Error fetching availabilities:", availabilitiesResponse.error)
          throw new Error("Failed to load availability data")
        }

        if (eventsResponse.error) {
          console.error("Error fetching events:", eventsResponse.error)
          throw new Error("Failed to load events data")
        }

        setAvailabilities(availabilitiesResponse.data || [])
        setEvents(eventsResponse.data || [])
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load data. Please try again.")
      } finally {
        setFetchingData(false)
      }
    }

    fetchData()
  }, [parkingSpotId])

  // Generate time options (every 30 minutes)
  const timeOptions = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, "0")
      const formattedMinute = minute.toString().padStart(2, "0")
      timeOptions.push(`${formattedHour}:${formattedMinute}`)
    }
  }

  // Function to check if a date is disabled
  const isDateDisabled = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd")
    const availability = availabilities.find((a) => a.date === dateString)

    // If explicitly marked as unavailable
    if (availability && !availability.is_available) {
      return true
    }

    // If date is in the past
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return true
    }

    return false
  }

  const handleBooking = async () => {
    if (!isAuthenticated) {
      // Redirect to login page
      router.push(`/login?redirect=/listings/${parkingSpotId}`)
      return
    }

    if (!date) {
      setError("Please select a date")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append("parkingSpotId", parkingSpotId)
      formData.append("date", format(date, "yyyy-MM-dd"))
      formData.append("checkInTime", checkInTime)
      formData.append("checkOutTime", checkOutTime)
      formData.append("price", effectivePrice.toString())
      formData.append("serviceFee", serviceFee.toString())
      formData.append("total", total.toString())

      const result = await createBooking(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      // Redirect to booking confirmation page
      router.push(`/bookings/${result.id}/confirmation`)
    } catch (err: any) {
      console.error("Error creating booking:", err)
      setError(err.message || "Failed to create booking")
    } finally {
      setLoading(false)
    }
  }

  // Get events for the selected date
  const selectedDateEvents = selectedDate ? events.filter((e) => e.date === selectedDate) : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          ${effectivePrice.toFixed(2)} <span className="text-base font-normal text-muted-foreground">/ day</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                disabled={fetchingData}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {fetchingData ? "Loading availability..." : date ? format(date, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={isDateDisabled}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Check-in</label>
            <Select value={checkInTime} onValueChange={setCheckInTime}>
              <SelectTrigger className="w-full">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={`checkin-${time}`} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Check-out</label>
            <Select value={checkOutTime} onValueChange={setCheckOutTime}>
              <SelectTrigger className="w-full">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={`checkout-${time}`} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedDateEvents.length > 0 && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">Events on this date:</p>
            <ul className="text-sm space-y-1">
              {selectedDateEvents.map((event) => (
                <li key={event.id}>{event.name}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4 pt-4">
          <div className="flex justify-between">
            <span>Parking fee</span>
            <span>${effectivePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service fee</span>
            <span>${serviceFee.toFixed(2)}</span>
          </div>
          <div className="border-t pt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleBooking} disabled={loading || !date || fetchingData}>
          {loading ? "Processing..." : "Reserve"}
        </Button>
      </CardFooter>
    </Card>
  )
}

