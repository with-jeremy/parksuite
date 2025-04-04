export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { Calendar, Clock, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MainNav } from "@/components/main-nav"
import { createClient } from "@/utils/supabase/server"

export default async function UserBookingsPage() {
  const supabase = await createClient()

  // Check if user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch the user's bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      parking_spots(
        id, title, city, state,
        parking_spot_images(image_url, is_primary)
      )
    `)
    .eq("user_id", session.user.id)
    .order("booking_date", { ascending: false })

  // Separate upcoming and past bookings
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingBookings = bookings?.filter((booking) => new Date(booking.booking_date) >= today) || []

  const pastBookings = bookings?.filter((booking) => new Date(booking.booking_date) < today) || []

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Your Bookings</h1>

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="w-full max-w-md">
              <TabsTrigger value="upcoming" className="flex-1">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                Past ({pastBookings.length})
              </TabsTrigger>
            </TabsList>

            <div className="space-y-6">
              {/* Upcoming Bookings */}
              <div className={upcomingBookings.length === 0 ? "block" : "hidden"} data-tab="upcoming">
                <div className="text-center p-8 border rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-2">No upcoming bookings</h3>
                  <p className="text-muted-foreground mb-4">You don't have any upcoming parking reservations.</p>
                  <Button asChild>
                    <Link href="/listings">Find Parking</Link>
                  </Button>
                </div>
              </div>

              <div className={upcomingBookings.length > 0 ? "block" : "hidden"} data-tab="upcoming">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingBookings.map((booking) => {
                    // Get the primary image or first image
                    const images = booking.parking_spots.parking_spot_images
                    const primaryImage = images.find((img) => img.is_primary)?.image_url || images[0]?.image_url

                    return (
                      <Card key={booking.id} className="overflow-hidden">
                        <div className="aspect-video relative">
                          <Image
                            src={primaryImage || "/placeholder.svg?height=200&width=300"}
                            alt={booking.parking_spots.title}
                            fill
                            className="object-cover"
                          />
                          <Badge
                            className="absolute top-2 right-2"
                            variant={booking.status === "confirmed" ? "default" : "secondary"}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold truncate">{booking.parking_spots.title}</h3>
                          <div className="space-y-2 mt-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {booking.parking_spots.city}, {booking.parking_spots.state}
                              </span>
                            </div>
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
                            <Link href={`/dashboard/bookings/${booking.id}`}>View Details</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Past Bookings */}
              <div className={pastBookings.length === 0 ? "block" : "hidden"} data-tab="past">
                <div className="text-center p-8 border rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-2">No past bookings</h3>
                  <p className="text-muted-foreground">You don't have any past parking reservations.</p>
                </div>
              </div>

              <div className={pastBookings.length > 0 ? "block" : "hidden"} data-tab="past">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pastBookings.map((booking) => {
                    // Get the primary image or first image
                    const images = booking.parking_spots.parking_spot_images
                    const primaryImage = images.find((img) => img.is_primary)?.image_url || images[0]?.image_url

                    return (
                      <Card key={booking.id} className="overflow-hidden">
                        <div className="aspect-video relative">
                          <Image
                            src={primaryImage || "/placeholder.svg?height=200&width=300"}
                            alt={booking.parking_spots.title}
                            fill
                            className="object-cover"
                          />
                          <Badge
                            className="absolute top-2 right-2"
                            variant={booking.status === "completed" ? "default" : "secondary"}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold truncate">{booking.parking_spots.title}</h3>
                          <div className="space-y-2 mt-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {booking.parking_spots.city}, {booking.parking_spots.state}
                              </span>
                            </div>
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
                          </div>
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Total</span>
                              <span className="font-semibold">${booking.total_price.toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex gap-2">
                          <Button variant="outline" className="flex-1" asChild>
                            <Link href={`/dashboard/bookings/${booking.id}`}>View</Link>
                          </Button>
                          {booking.status === "completed" && !booking.has_review && (
                            <Button className="flex-1" asChild>
                              <Link href={`/dashboard/bookings/${booking.id}/review`}>Review</Link>
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </main>
      <footer className="border-t bg-background">
        <div className="container py-6 md:py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} ParkSuite. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

