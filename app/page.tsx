export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { Calendar, MapPin, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MainNav } from "@/components/main-nav"
import { createClient } from "@/utils/supabase/server"

export default async function Home() {
  const supabase = await createClient()

  // Fetch upcoming events
  const today = new Date().toISOString().split("T")[0]
  const { data: events = [] } = await supabase
    .from("events")
    .select(`
      id, name, date, image_url,
      venues(name)
    `)
    .eq("is_active", true)
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(6)

  // Fetch featured parking spots
  const { data: featuredSpots = [] } = await supabase
    .from("parking_spots")
    .select(`
      id, title, city, state, price_per_day, is_active,
      parking_spot_images(image_url, is_primary),
      venues(name),
      reviews(rating)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6)

  // Process parking spots data
  const processedSpots =
    featuredSpots?.map((spot) => {
      // Calculate average rating
      const avgRating =
        spot.reviews && spot.reviews.length > 0
          ? spot.reviews.reduce((sum, review) => sum + review.rating, 0) / spot.reviews.length
          : 0

      // Get primary image
      const primaryImage =
        spot.parking_spot_images && spot.parking_spot_images.length > 0
          ? spot.parking_spot_images.find((img) => img.is_primary)?.image_url || spot.parking_spot_images[0]?.image_url
          : null

      return {
        id: spot.id,
        title: spot.title,
        distance: `${Math.random().toFixed(1)} miles`,
        venue: spot.venues?.name || "Nearby Venue",
        price: spot.price_per_day,
        rating: avgRating.toFixed(1),
        availability: spot.is_active ? "Available" : "Unavailable",
        image: primaryImage || "/placeholder.svg?height=200&width=300",
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
        <section className="w-full py-12 md:py-24 lg:py-32 relative">
          <div className="absolute inset-0 z-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hero.jpg-F7kNphhVZzIDuPxIHInO6Y1scxkq0d.jpeg"
              alt="Dodger Stadium aerial view at sunset"
              fill
              className="object-cover brightness-[0.4]"
              priority
            />
          </div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-white">
                    Event Parking Made Easy
                  </h1>
                  <p className="max-w-[600px] text-gray-200 md:text-xl">
                    Find and reserve the perfect parking spot for your next game or event. No more circling the block or overpaying for stadium parking.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="/listings"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    Find Parking
                  </Link>
                  <Link
                    href="/host"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-white bg-transparent px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    List Your Spot
                  </Link>
                </div>
              </div>
              <div className="mx-auto w-full max-w-[500px] lg:max-w-none">
                <Card className="border-none shadow-xl">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold">Find your spot</h3>
                      <Tabs defaultValue="event">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="event">Event</TabsTrigger>
                          <TabsTrigger value="venue">Venue</TabsTrigger>
                          <TabsTrigger value="neighborhood">Neighborhood</TabsTrigger>
                        </TabsList>
                        <TabsContent value="event" className="space-y-4 pt-4">
                          <div className="grid gap-2">
                            <label
                              htmlFor="event"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Event
                            </label>
                            <Input id="event" placeholder="e.g. Cowboys vs Eagles" />
                          </div>
                          <div className="grid gap-2">
                            <label
                              htmlFor="date"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Date
                            </label>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 opacity-50" />
                              <Input id="date" type="date" />
                            </div>
                          </div>
                          <Button className="w-full">Search Parking</Button>
                        </TabsContent>
                        <TabsContent value="venue" className="space-y-4 pt-4">
                          <div className="grid gap-2">
                            <label
                              htmlFor="venue"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Venue
                            </label>
                            <Input id="venue" placeholder="e.g. AT&T Stadium" />
                          </div>
                          <div className="grid gap-2">
                            <label
                              htmlFor="location"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Location
                            </label>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 opacity-50" />
                              <Input id="location" placeholder="City or zip code" />
                            </div>
                          </div>
                          <Button className="w-full">Search Parking</Button>
                        </TabsContent>
                        <TabsContent value="neighborhood" className="space-y-4 pt-4">
                          <div className="grid gap-2">
                            <label
                              htmlFor="neighborhood"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Neighborhood
                            </label>
                            <Input id="neighborhood" placeholder="e.g. Downtown, West End" />
                          </div>
                          <div className="grid gap-2">
                            <label
                              htmlFor="neighborhood-city"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              City
                            </label>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 opacity-50" />
                              <Input id="neighborhood-city" placeholder="City name" />
                            </div>
                          </div>
                          <Button className="w-full">Search Parking</Button>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Popular Events</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  Find parking for upcoming games and events in your area
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {events && events.length > 0 ? (
                events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group relative overflow-hidden rounded-lg border"
                  >
                    <div className="aspect-video w-full overflow-hidden">
                      <Image
                        src={event.image_url || "/placeholder.svg?height=400&width=600"}
                        alt={event.name}
                        width={600}
                        height={400}
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{event.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.venues.name}</span>
                      </div>
                      <Badge className="mt-2">Find Parking</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-muted-foreground">No upcoming events found</p>
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Featured Parking Spots</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  Top-rated parking spots near popular venues
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {processedSpots.map((spot) => (
                <Link
                  key={spot.id}
                  href={`/listings/${spot.id}`}
                  className="group relative overflow-hidden rounded-lg border bg-background"
                >
                  <div className="aspect-video w-full overflow-hidden">
                    <Image
                      src={spot.image || "/placeholder.svg?height=400&width=600"}
                      alt={spot.title}
                      width={600}
                      height={400}
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{spot.title}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="text-sm font-medium">{spot.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {spot.distance} from {spot.venue}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="font-semibold">
                        ${spot.price} <span className="text-sm font-normal text-muted-foreground">/ day</span>
                      </p>
                      <Badge variant={spot.availability === "Available" ? "default" : "secondary"}>
                        {spot.availability}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
              <Image
                src="https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.0.3"
                alt="Host your parking spot"
                width={800}
                height={550}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
              />
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Earn Money With Your Parking Space
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Turn your unused driveway, garage, or parking spot into extra income. It's easy to list and start
                    earning.
                  </p>
                </div>
                <ul className="grid gap-2 py-4">
                  <li className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      1
                    </div>
                    <span>List your spot for free in minutes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      2
                    </div>
                    <span>Set your own schedule and prices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      3
                    </div>
                    <span>Get paid directly to your bank account</span>
                  </li>
                </ul>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="/host"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    Become a Host
                  </Link>
                  <Link
                    href="/host-faq"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-background">
        <div className="container flex flex-col gap-6 py-8 md:flex-row md:py-12">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/parksuite-dropper-logo-web-4dGRNQ7dML48d36q9AQoGbfedWyEY4.png"
                alt="ParkSuite Logo"
                width={24}
                height={24}
              />
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/parksuite-text-logo-m5GAj7JlD0R2QiQlt0gmHAentqEB37.png"
                alt="ParkSuite"
                width={120}
                height={24}
                className="h-6 object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground">Game day parking made easy.</p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-muted-foreground hover:underline">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-sm text-muted-foreground hover:underline">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/press" className="text-sm text-muted-foreground hover:underline">
                    Press
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Help</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/support" className="text-sm text-muted-foreground hover:underline">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-muted-foreground hover:underline">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-sm text-muted-foreground hover:underline">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-sm text-muted-foreground hover:underline">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Social</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="https://twitter.com" className="text-sm text-muted-foreground hover:underline">
                    Twitter
                  </Link>
                </li>
                <li>
                  <Link href="https://instagram.com" className="text-sm text-muted-foreground hover:underline">
                    Instagram
                  </Link>
                </li>
                <li>
                  <Link href="https://facebook.com" className="text-sm text-muted-foreground hover:underline">
                    Facebook
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t py-6">
          <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
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

