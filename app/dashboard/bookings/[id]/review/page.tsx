export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { MainNav } from "@/components/main-nav"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { ReviewForm } from "@/components/booking/review-form"

export default async function LeaveReviewPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

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
      id, status, has_review,
      parking_spots(
        id, title,
        parking_spot_images(image_url, is_primary)
      )
    `)
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single()

  if (!booking) {
    redirect("/dashboard/bookings")
  }

  // Check if booking is completed and not yet reviewed
  if (booking.status !== "completed" || booking.has_review) {
    redirect(`/dashboard/bookings/${params.id}`)
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
        <div className="container max-w-2xl py-8">
          <div className="mb-6">
            <Link
              href={`/dashboard/bookings/${params.id}`}
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to booking
            </Link>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Leave a Review</h1>
              <p className="text-muted-foreground">Share your experience with this parking spot to help other users.</p>
            </div>

            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="w-16 h-16 overflow-hidden rounded-md">
                <Image
                  src={primaryImage || "/placeholder.svg?height=64&width=64"}
                  alt={booking.parking_spots.title}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h2 className="font-semibold">{booking.parking_spots.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Your booking on {new Date(booking.booking_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <ReviewForm bookingId={booking.id} />
          </div>
        </div>
      </main>
      <footer className="border-t bg-background">
        <div className="container py-6 md:py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} ParkSpot. All rights reserved.
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

