export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { Filter, MapPin, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MainNav } from "@/components/main-nav"
import { createClient } from "@/utils/supabase/server"

export default async function ListingsPage({
  searchParams,
}: {
  searchParams?: {
    event?: string
    date?: string
    price?: string
    distance?: string
    amenities?: string
    type?: string
  }
}) {
  const supabase = await createClient()

  // Fetch venue types for the event dropdown
  const { data: venueTypes } = await supabase.from("venue_types").select("id, name").order("name")

  // Fetch events for the event dropdown
  const { data: events } = await supabase
    .from("events")
    .select("id, name, date, venue_id")
    .eq("is_active", true)
    .order("date")
    .limit(10)

  // Fetch amenities for the filter checkboxes
  const { data: amenities } = await supabase.from("amenities").select("id, name").order("name")

  // Build the query for parking spots
  let query = supabase
    .from("parking_spots")
    .select(`
      id, title, description, city, state, price_per_day, type, spaces_available, is_active,
      parking_spot_images(id, image_url, is_primary),
      parking_spot_amenities(
        amenities(id, name)
      ),
      reviews(rating)
    `)
    .eq("is_active", true)

  // Apply filters if provided
  if (searchParams?.event) {
    const { data: eventData } = await supabase.from("events").select("venue_id").eq("id", searchParams.event).single()

    if (eventData) {
      // In a real app, you'd filter spots near the venue using geolocation
      // For now, we'll just note this would be implemented here
    }
  }

  if (searchParams?.type) {
    const types = searchParams.type.split(",")
    query = query.in("type", types)
  }

  if (searchParams?.price) {
    const maxPrice = Number.parseInt(searchParams.price)
    if (!isNaN(maxPrice)) {
      query = query.lte("price_per_day", maxPrice)
    }
  }

  // Execute the query
  const { data: parkingSpots, error } = await query.order("created_at", { ascending: false }).limit(24)

  if (error) {
    console.error("Error fetching parking spots:", error)
  }

  // Process the results
  const processedSpots =
    parkingSpots?.map((spot) => {
      // Calculate average rating
      const avgRating =
        spot.reviews.length > 0
          ? spot.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / spot.reviews.length
          : 0

      // Get primary image
      const primaryImage =
        spot.parking_spot_images.find((img: any) => img.is_primary)?.image_url || spot.parking_spot_images[0]?.image_url

      return {
        id: spot.id,
        title: spot.title,
        distance: `${(Math.random() * 2).toFixed(1)} miles`, // This would need geolocation calculation
        price: spot.price_per_day,
        rating: avgRating.toFixed(1),
        availability: spot.is_active ? "Available" : "Unavailable",
        featured: Math.random() > 0.7, // This would need a featured field in the database
        image: primaryImage || "/placeholder.svg?height=200&width=300",
        city: spot.city,
        state: spot.state,
      }
    }) || []

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="w-full md:w-1/4 lg:w-1/5">
              <div className="sticky top-20 space-y-6">
                <div>
                  <h2 className="mb-2 text-lg font-semibold">Filters</h2>
                  <Button variant="outline" size="sm" className="mb-4 w-full justify-start" asChild>
                    <Link href="/listings">
                      <Filter className="mr-2 h-4 w-4" />
                      Clear All Filters
                    </Link>
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Event</h3>
                    <Select defaultValue={searchParams?.event}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events?.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name} ({new Date(event.date).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Date</h3>
                    <Input type="date" defaultValue={searchParams?.date} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Price Range</h3>
                    <div className="space-y-2">
                      <Slider
                        defaultValue={[searchParams?.price ? Number.parseInt(searchParams.price) : 50]}
                        max={200}
                        step={5}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm">$0</span>
                        <span className="text-sm font-medium">${searchParams?.price || "50"}</span>
                        <span className="text-sm">$200+</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Distance from Venue</h3>
                    <div className="space-y-2">
                      <Slider
                        defaultValue={[searchParams?.distance ? Number.parseFloat(searchParams.distance) : 1]}
                        max={5}
                        step={0.5}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm">0 mi</span>
                        <span className="text-sm font-medium">{searchParams?.distance || "1"} mi</span>
                        <span className="text-sm">5+ mi</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Amenities</h3>
                    <div className="space-y-2">
                      {amenities?.map((amenity) => (
                        <div key={amenity.id} className="flex items-center space-x-2">
                          <Checkbox id={`amenity-${amenity.id}`} />
                          <label
                            htmlFor={`amenity-${amenity.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {amenity.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Parking Type</h3>
                    <div className="space-y-2">
                      {["driveway", "garage", "lot", "street"].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox id={type} />
                          <label
                            htmlFor={type}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-3/4 lg:w-4/5">
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Find Parking</h1>
                <p className="text-muted-foreground">{processedSpots.length} available parking spots</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {processedSpots.map((spot) => (
                  <Link key={spot.id} href={`/listings/${spot.id}`} className="group">
                    <Card className="overflow-hidden transition-all hover:shadow-md">
                      <div className="aspect-video relative overflow-hidden">
                        <Image
                          src={spot.image || "/placeholder.svg?height=200&width=300"}
                          alt={spot.title}
                          width={600}
                          height={400}
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        {spot.featured && (
                          <Badge className="absolute top-2 left-2" variant="secondary">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{spot.title}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span className="text-sm font-medium">{spot.rating}</span>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {spot.city}, {spot.state}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{spot.distance} from venue</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="font-semibold">
                            ${spot.price} <span className="text-sm font-normal text-muted-foreground">/ day</span>
                          </p>
                          <Badge variant={spot.availability === "Available" ? "default" : "secondary"}>
                            {spot.availability}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              {processedSpots.length === 0 && (
                <div className="text-center p-12 border rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-2">No parking spots found</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your filters or search criteria</p>
                  <Button asChild variant="outline">
                    <Link href="/listings">Clear Filters</Link>
                  </Button>
                </div>
              )}
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

