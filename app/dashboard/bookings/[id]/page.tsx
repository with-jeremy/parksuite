export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { Calendar, Clock, MapPin, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MainNav } from "@/components/main-nav"
import { createClient } from "@/utils/supabase/server"
import { CancelBookingButton } from "@/components/booking/cancel-booking-button"

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Check if user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch the booking with parking spot details
  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      *,
      parking_spots(
        id, title, address, city, state, zip_code, description,
        parking_spot_images(image_url, is_primary),
        users!parking_spots_owner_id_fkey(id, first_name, last_name, email, phone)
      )
    `)
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single()

  if (!booking) {
    redirect("/dashboard/bookings")
  }

  // Get the primary image or first image
  const images = booking.parking_spots.parking_spot_images
  const primaryImage = images.find((img) => img.is_primary)?.image_url || images[0]?.image_url

  // Check if booking is upcoming
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isUpcoming = new Date(booking.booking_date) >= today

  // Check if booking is cancellable (more than 24 hours before)
  const bookingDate = new Date(booking.booking_date)
  const checkInTime = booking.check_in_time.split(":")
  bookingDate.setHours(Number.parseInt(checkInTime[0]), Number.parseInt(checkInTime[1]), 0, 0)

  const now = new Date()
  const timeDiff = bookingDate.getTime() - now.getTime()
  const hoursDiff = timeDiff / (1000 * 60 * 60)

  const isCancellable = hoursDiff > 24 && booking.status !== "cancelled"

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-6">
            <Link
              href="/dashboard/bookings"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to bookings
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl mb-2">{booking.parking_spots.title}</h1>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      booking.status === "confirmed"
                        ? "default"
                        : booking.status === "completed"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                  {isUpcoming && (
                    <span className="text-sm text-muted-foreground">
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="aspect-video overflow-hidden rounded-lg">
                <Image
                  src={primaryImage || "/placeholder.svg?height=400&width=800"}
                  alt={booking.parking_spots.title}
                  width={800}
                  height={400}
                  className="h-full w-full object-cover"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Date</h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Check-in</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.check_in_time}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Check-out</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.check_out_time}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Location</h3>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{booking.parking_spots.address}</p>
                        <p>
                          {booking.parking_spots.city}, {booking.parking_spots.state} {booking.parking_spots.zip_code}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Description</h3>
                    <p className="text-muted-foreground">
                      {booking.parking_spots.description || "No description provided."}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Payment</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parking fee</span>
                        <span>${(booking.total_price - booking.service_fee).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service fee</span>
                        <span>${booking.service_fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                        <span>Total</span>
                        <span>${booking.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                {isUpcoming && isCancellable && (
                  <CardFooter>
                    <CancelBookingButton bookingId={booking.id} />
                  </CardFooter>
                )}
              </Card>
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Host Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {booking.parking_spots.users.first_name[0]}
                        {booking.parking_spots.users.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {booking.parking_spots.users.first_name} {booking.parking_spots.users.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">Host</p>
                    </div>
                  </div>

                  {isUpcoming && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm">Contact the host if you have any questions about your booking.</p>
                        {booking.parking_spots.users.phone && (
                          <p className="text-sm">
                            <span className="font-medium">Phone:</span> {booking.parking_spots.users.phone}
                          </p>
                        )}
                        <p className="text-sm">
                          <span className="font-medium">Email:</span> {booking.parking_spots.users.email}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  {booking.status === "completed" && !booking.has_review && (
                    <Button className="w-full" asChild>
                      <Link href={`/dashboard/bookings/${booking.id}/review`}>Leave a Review</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
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

