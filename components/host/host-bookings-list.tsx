"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Clock, MapPin, User } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const supabase = createClient()

export function HostBookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("upcoming")

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error("Not authenticated")

        // Get bookings for the host's parking spots
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id, 
            booking_date, 
            check_in_time, 
            check_out_time, 
            total_price, 
            status, 
            created_at,
            parking_spot:parking_spots(title, address, city, state),
            user:users(first_name, last_name, email)
          `)
          .in("status", filter === "upcoming" ? ["pending", "confirmed"] : ["completed", "cancelled"])
          .order("booking_date", { ascending: filter === "upcoming" })

        if (error) throw error

        setBookings(data || [])
      } catch (err: any) {
        console.error("Error fetching bookings:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [filter])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "pending":
        return "outline"
      case "cancelled":
        return "destructive"
      case "completed":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading your bookings...</div>
  }

  if (error) {
    return <div className="bg-red-50 p-4 rounded-md text-red-800">Error: {error}</div>
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upcoming" value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
      </Tabs>

      {bookings.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/50">
          <h3 className="font-semibold mb-2">No {filter} bookings</h3>
          <p className="text-muted-foreground">
            {filter === "upcoming"
              ? "You don't have any upcoming bookings at the moment."
              : "You don't have any past bookings yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold">{booking.parking_spot.title}</h3>
                  <Badge variant={getStatusBadgeVariant(booking.status)}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {booking.check_in_time} - {booking.check_out_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {booking.parking_spot.city}, {booking.parking_spot.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {booking.user.first_name} {booking.user.last_name}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">${booking.total_price.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/host/dashboard/bookings/${booking.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

