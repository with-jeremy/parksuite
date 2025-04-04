export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { Calendar, Check, Clock, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNav } from "@/components/main-nav"
import { createClient } from "@/utils/supabase/server"

export default async function BookingConfirmationPage({ params }: { params: { id: string } }) {
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
        id, title, address, city, state, zip_code,
        parking_spot_images(image_url, is_primary)
      )
    `)
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single()

  if (!booking) {
    redirect("/dashboard")
  }

  // Get the primary image or first image
  const images = booking.parking_spots.parking_spot_images
  const primaryImage = images.find((img) => img.is_primary)?.image_url || images[0]?.image_url

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1">
        <div className="container max-w-3xl py-12">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground">
              Your parking spot has been reserved. You'll receive a confirmation email shortly.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="aspect-square overflow-hidden rounded-md">
                    <Image
                      src={primaryImage || "/placeholder.svg?height=300&width=300"}
                      alt={booking.parking_spots.title}
                      width={300}
                      height={300}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div className="md:w-2/3 space-y-4">
                  <h2 className="text-xl font-semibold">{booking.parking_spots.title}</h2>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {booking.parking_spots.city}, {booking.parking_spots.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {booking.check_in_time} - {booking.check_out_time}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Parking fee</span>
                      <span>${(booking.total_price - booking.service_fee).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Service fee</span>
                      <span>${booking.service_fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                      <span>Total</span>
                      <span>${booking.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/dashboard/bookings">View All Bookings</Link>
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/">Return to Home</Link>
              </Button>
            </CardFooter>
          </Card>

          <div className="bg-muted p-6 rounded-lg">
            <h2 className="font-semibold mb-4">What's Next?</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span>You'll receive detailed directions to your parking spot via email.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span>On the day of your booking, arrive at your scheduled check-in time.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span>Follow any specific instructions provided by the host.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <span>After your booking, please leave a review to help other parkers.</span>
              </li>
            </ul>
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

