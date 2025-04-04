export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { Check, ChevronLeft, MapPin, Shield, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MainNav } from "@/components/main-nav"
import { BookingForm } from "@/components/booking/booking-form"
import { createClient } from "@/utils/supabase/server"

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Check if user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Fetch the listing with amenities and images
  const { id } = await params
  const { data: listing } = await supabase
    .from("parking_spots")
    .select(`
      *,
      parking_spot_amenities(
        amenities(id, name)
      ),
      parking_spot_images(id, image_url, is_primary),
      users!parking_spots_owner_id_fkey(
        id, first_name, last_name, avatar_url, created_at
      ),
      reviews(
        id, rating, comment, created_at,
        users(id, first_name, last_name, avatar_url)
      )
    `)
    .eq("id", id || "")
    .single()

  if (!listing) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center">
            <MainNav />
          </div>
        </header>
        <main className="flex-1 container py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The parking spot you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/listings">Browse Listings</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Process the data
  const amenities = listing.parking_spot_amenities.map((item) => item.amenities)
  const images = listing.parking_spot_images
  const primaryImage = images.find((img) => img.is_primary)?.image_url || images[0]?.image_url
  const otherImages = images.filter((img) => !img.is_primary).map((img) => img.image_url)
  const host = listing.users
  const reviews = listing.reviews

  // Calculate average rating
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  // Format the rating to one decimal place
  const formattedRating = averageRating.toFixed(1)

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6 md:py-8">
          <div className="mb-6">
            <Link
              href="/listings"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to listings
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-10">
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">{listing.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium">{formattedRating}</span>
                      <span className="text-muted-foreground">({reviews.length} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {listing.city}, {listing.state}
                      </span>
                    </div>
                    <Badge variant={listing.is_active ? "default" : "secondary"}>
                      {listing.is_active ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="aspect-video overflow-hidden rounded-lg">
                    <Image
                      src={primaryImage || "/placeholder.svg?height=400&width=600"}
                      alt={listing.title}
                      width={600}
                      height={400}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {otherImages.slice(0, 4).map((image, index) => (
                      <div key={index} className="aspect-square overflow-hidden rounded-lg">
                        <Image
                          src={image || "/placeholder.svg?height=300&width=300"}
                          alt={`${listing.title} ${index + 2}`}
                          width={300}
                          height={300}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h2 className="text-xl font-semibold">About this parking space</h2>
                    <p className="mt-2 text-muted-foreground">{listing.description || "No description provided."}</p>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Features</h2>
                    <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                      {amenities.length > 0 ? (
                        amenities.map((amenity, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span>{amenity.name}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">No features listed</li>
                      )}
                    </ul>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Location</h2>
                  <div className="mt-2 aspect-[16/9] overflow-hidden rounded-lg bg-muted">
                    <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
                      Map view would be displayed here
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Exact location provided after booking</p>
                </div>
                <Tabs defaultValue="reviews">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                    <TabsTrigger value="host">Host</TabsTrigger>
                    <TabsTrigger value="policies">Policies</TabsTrigger>
                  </TabsList>
                  <TabsContent value="reviews" className="space-y-6 pt-4">
                    {reviews.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {reviews.map((review) => (
                          <Card key={review.id}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <Avatar>
                                  <AvatarImage
                                    src={review.users.avatar_url || undefined}
                                    alt={review.users.first_name}
                                  />
                                  <AvatarFallback>
                                    {review.users.first_name[0]}
                                    {review.users.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-base">
                                    {review.users.first_name} {review.users.last_name}
                                  </CardTitle>
                                  <CardDescription>{new Date(review.created_at).toLocaleDateString()}</CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? "fill-primary text-primary" : "text-muted"
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-sm">{review.comment}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">No reviews yet</p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="host" className="pt-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={host.avatar_url || undefined} alt={host.first_name} />
                            <AvatarFallback>
                              {host.first_name[0]}
                              {host.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle>
                              {host.first_name} {host.last_name}
                            </CardTitle>
                            <CardDescription>
                              Host since{" "}
                              {new Date(host.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                              })}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span className="font-medium">{formattedRating}</span>
                            <span className="text-muted-foreground">({reviews.length} reviews)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4 text-primary" />
                            <span>Identity verified</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full">
                          Contact Host
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                  <TabsContent value="policies" className="pt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Parking Policies</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="font-semibold">Cancellation Policy</h3>
                          <p className="text-sm text-muted-foreground">
                            Full refund up to 24 hours before the start time. No refund after that.
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <h3 className="font-semibold">Check-in & Check-out</h3>
                          <p className="text-sm text-muted-foreground">
                            You can arrive anytime after your booking start time and must leave by the end time.
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <h3 className="font-semibold">Rules</h3>
                          <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                            <li>• No overnight parking unless specified</li>
                            <li>• Follow all posted signs and instructions</li>
                            <li>• No blocking other vehicles or driveways</li>
                            <li>• Tailgating allowed only in designated areas</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <div>
              <div className="sticky top-24">
                <BookingForm parkingSpotId={listing.id} price={listing.price_per_day} isAuthenticated={!!session} />
              </div>
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

