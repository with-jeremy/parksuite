export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { Building, MapPin, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/main-nav"
import { createClient } from "@/utils/supabase/client"

export default async function AdminVenuesPage() {
  const supabase = await createClient()

  // Check if user is logged in and is an admin
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Check if user is an admin
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()

  if (!user?.is_admin) {
    redirect("/dashboard")
  }

  // Fetch all venues
  const { data: venues } = await supabase
    .from("venues")
    .select(`
      id, name, address, city, state, zip_code, capacity, image_url, is_active,
      venue_types(name)
    `)
    .order("name")

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Venues</h1>
            <Button asChild>
              <Link href="/admin/venues/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Venue
              </Link>
            </Button>
          </div>

          {venues && venues.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {venues.map((venue) => (
                <Card key={venue.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <Image
                      src={venue.image_url || "/placeholder.svg?height=200&width=300"}
                      alt={venue.name}
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-2 right-2" variant={venue.is_active ? "default" : "secondary"}>
                      {venue.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{venue.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {venue.city}, {venue.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{venue.venue_types.name}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/admin/venues/${venue.id}`}>Edit</Link>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/admin/venues/${venue.id}/events`}>Events</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">No venues yet</h3>
              <p className="text-muted-foreground mb-4">Add your first venue to start creating events.</p>
              <Button asChild>
                <Link href="/admin/venues/new">Add Venue</Link>
              </Button>
            </div>
          )}
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

