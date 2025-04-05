export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { MainNav } from "@/components/main-nav"
import { AvailabilityCalendar } from "@/components/host/availability-calendar"
import { createClient } from "@/utils/supabase/server"

export default async function ListingAvailabilityPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Check if user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch the listing
  const { data: listing } = await supabase
    .from("parking_spots")
    .select("id, title, price_per_day, owner_id")
    .eq("id", params.id)
    .single()

  if (!listing) {
    notFound()
  }

  // Check if user is the owner
  if (listing.owner_id !== session.user.id) {
    redirect("/host/dashboard")
  }

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
              href={`/host/dashboard/listings/${params.id}`}
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to listing
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
          <p className="text-muted-foreground mb-6">Manage availability and pricing</p>

          <AvailabilityCalendar parkingSpotId={listing.id} defaultPrice={listing.price_per_day} />
        </div>
      </main>
      <footer className="border-t bg-background">
        <div className="container py-6 md:py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} ParkSpot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

