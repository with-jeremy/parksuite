"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isBefore } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Trash, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createAvailability, updateAvailability, deleteAvailability } from "@/lib/actions/host-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const supabase = createClient()

export function AvailabilityCalendar({
  parkingSpotId,
  defaultPrice,
}: {
  parkingSpotId: string
  defaultPrice: number
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedAvailability, setSelectedAvailability] = useState<Availability | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    isAvailable: true,
    price: defaultPrice.toString(),
    notes: "",
  })

  useEffect(() => {
    fetchAvailabilities()
    fetchEvents()
  }, [parkingSpotId, currentMonth])

  const fetchAvailabilities = async () => {
    try {
      setLoading(true)
      setError(null)

      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd")
      const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd")

      // Changed from "parking_spot_availability" to "availability"
      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("parking_spot_id", parkingSpotId)
        .gte("date", startDate)
        .lte("date", endDate)

      if (error) throw error

      setAvailabilities(data || [])
    } catch (err: any) {
      console.error("Error fetching availabilities:", err)
      setError("Failed to load availability data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd")
      const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd")

      const { data, error } = await supabase
        .from("events")
        .select("id, name, date, venue_id")
        .gte("date", startDate)
        .lte("date", endDate)
        .eq("is_active", true)

      if (error) throw error

      setEvents(data || [])
    } catch (err: any) {
      console.error("Error fetching events:", err)
      // Not setting error state here as events are secondary information
    }
  }

  const handlePreviousMonth = () => {
    setCurrentMonth((prevMonth) => {
      const newMonth = new Date(prevMonth)
      newMonth.setMonth(newMonth.getMonth() - 1)
      return newMonth
    })
  }

  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => {
      const newMonth = new Date(prevMonth)
      newMonth.setMonth(newMonth.getMonth() + 1)
      return newMonth
    })
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setActionError(null)

    // Check if there's an existing availability for this date
    const dateString = format(date, "yyyy-MM-dd")
    const existingAvailability = availabilities.find((a) => a.date === dateString)

    if (existingAvailability) {
      setSelectedAvailability(existingAvailability)
      setFormData({
        isAvailable: existingAvailability.is_available,
        price: existingAvailability.price_override?.toString() || defaultPrice.toString(),
        notes: existingAvailability.notes || "",
      })
    } else {
      setSelectedAvailability(null)
      setFormData({
        isAvailable: true,
        price: defaultPrice.toString(),
        notes: "",
      })
    }

    setIsDialogOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value === "true" }))
  }

  const validateForm = () => {
    // Validate price
    const price = Number.parseFloat(formData.price)
    if (isNaN(price) || price < 0) {
      setActionError("Please enter a valid price")
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!selectedDate || !validateForm()) return

    try {
      setActionLoading(true)
      setActionError(null)

      const dateString = format(selectedDate, "yyyy-MM-dd")
      const formDataObj = new FormData()

      formDataObj.append("parkingSpotId", parkingSpotId)
      formDataObj.append("date", dateString)
      formDataObj.append("isAvailable", formData.isAvailable.toString())
      formDataObj.append("price", formData.price)
      formDataObj.append("notes", formData.notes)

      let result
      if (selectedAvailability) {
        // Update existing availability
        result = await updateAvailability(selectedAvailability.id, formDataObj)
      } else {
        // Create new availability
        result = await createAvailability(formDataObj)
      }

      if (result.error) {
        setActionError(result.error)
        return
      }

      // Refresh availabilities
      fetchAvailabilities()

      // Close dialog
      setIsDialogOpen(false)
    } catch (err: any) {
      console.error("Error saving availability:", err)
      setActionError("Failed to save availability. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAvailability) return

    try {
      setActionLoading(true)
      setActionError(null)

      const result = await deleteAvailability(selectedAvailability.id)

      if (result.error) {
        setActionError(result.error)
        return
      }

      // Refresh availabilities
      fetchAvailabilities()

      // Close dialog
      setIsDialogOpen(false)
    } catch (err: any) {
      console.error("Error deleting availability:", err)
      setActionError("Failed to delete availability. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  // Generate calendar days
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = startOfMonth(currentMonth).getDay()

  // Create empty slots for days before first day of month
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Availability Calendar</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{format(currentMonth, "MMMM yyyy")}</span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Set your availability and pricing</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium py-1">
                    {day}
                  </div>
                ))}

                {/* Empty days */}
                {emptyDays.map((i) => (
                  <div key={`empty-${i}`} className="aspect-square p-1"></div>
                ))}

                {/* Calendar days */}
                {days.map((day) => {
                  const dateString = format(day, "yyyy-MM-dd")
                  const availability = availabilities.find((a) => a.date === dateString)
                  const dayEvents = events.filter((e) => e.date === dateString)
                  const isPast = isBefore(day, new Date()) && !isToday(day)

                  return (
                    <div key={dateString} className={cn("aspect-square p-1 relative", isPast && "opacity-50")}>
                      <button
                        onClick={() => !isPast && handleDateClick(day)}
                        disabled={isPast}
                        className={cn(
                          "w-full h-full flex flex-col items-center justify-start rounded-md text-sm p-1 relative",
                          availability?.is_available
                            ? "bg-green-50 hover:bg-green-100"
                            : availability
                              ? "bg-red-50 hover:bg-red-100"
                              : "bg-muted hover:bg-muted/80",
                          isToday(day) && "ring-2 ring-primary ring-offset-1",
                        )}
                      >
                        <span className="font-medium">{format(day, "d")}</span>

                        {availability?.price_override && (
                          <span className="text-xs mt-1">${availability.price_override}</span>
                        )}

                        {dayEvents.length > 0 && (
                          <div className="absolute bottom-1 right-1">
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">
                              {dayEvents.length}
                            </Badge>
                          </div>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-50 border border-green-200"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-50 border border-red-200"></div>
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-muted border"></div>
                  <span>Not Set</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDate && format(selectedDate, "MMMM d, yyyy")}</DialogTitle>
            <DialogDescription>Set availability and pricing for this date</DialogDescription>
          </DialogHeader>

          {selectedDate && (
            <div className="space-y-4">
              {actionError && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>{actionError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="isAvailable">Availability</Label>
                <Select
                  value={formData.isAvailable.toString()}
                  onValueChange={(value) => handleSelectChange("isAvailable", value)}
                  disabled={actionLoading}
                >
                  <SelectTrigger id="isAvailable">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Available</SelectItem>
                    <SelectItem value="false">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.isAvailable && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Price for this date"
                    disabled={actionLoading}
                  />
                  <p className="text-xs text-muted-foreground">Default price: ${defaultPrice}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Optional notes"
                  disabled={actionLoading}
                />
              </div>

              {/* Show events for this date if any */}
              {selectedDate && events.filter((e) => e.date === format(selectedDate, "yyyy-MM-dd")).length > 0 && (
                <div className="space-y-2">
                  <Label>Events on this date</Label>
                  <div className="space-y-1">
                    {events
                      .filter((e) => e.date === format(selectedDate, "yyyy-MM-dd"))
                      .map((event) => (
                        <div key={event.id} className="text-sm p-2 bg-muted rounded-md">
                          {event.name}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex items-center justify-between">
            {selectedAvailability && (
              <Button variant="destructive" type="button" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash className="h-4 w-4 mr-2" />}
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

