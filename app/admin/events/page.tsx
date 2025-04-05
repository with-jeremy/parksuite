export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { Calendar, MapPin, Plus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/main-nav"
import { createClient } from "@/utils/supabase/client"

export default async function AdminEventsPage() {
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

  // Fetch all events
  const { data: events } = await supabase
    .from("events")
    .select(`
      id, name, description, date, start_time, end_time, image_url, is_active,
      venues(id, name, city, state),
      event_types(name)
    `)
    .order("date", { ascending: true })

  // Group events by date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingEvents = events?.filter((event) => new Date(event.date) >= today) || []

  const pastEvents = events?.filter((event) => new Date(event.date) < today) || []

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
            <h1 className="text-3xl font-bold">Events</h1>
            <Button asChild>
              <Link href="/admin/events/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Link>
            </Button>
          </div>

          <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
          {upcomingEvents.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <Image
                      src={event.image_url || "/placeholder.svg?height=200&width=300"}
                      alt={event.name}
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-2 right-2" variant={event.is_active ? "default" : "secondary"}>
                      {event.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{event.name}</h3>
                    <div className="space-y-1 mt-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.venues.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{event.event_types.name}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/admin/events/${event.id}`}>Edit</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg bg-muted/50 mb-8">
              <h3 className="font-semibold mb-2">No upcoming events</h3>
              <p className="text-muted-foreground mb-4">Add your first event to start managing parking.</p>
              <Button asChild>
                <Link href="/admin/events/new">Add Event</Link>
              </Button>
            </div>
          )}

          <h2 className="text-xl font-semibold mb-4">Past Events</h2>
          {pastEvents.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <Image
                      src={event.image_url || "/placeholder.svg?height=200&width=300"}
                      alt={event.name}
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-2 right-2" variant="secondary">
                      Past
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{event.name}</h3>
                    <div className="space-y-1 mt-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.venues.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{event.event_types.name}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/admin/events/${event.id}`}>View</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">No past events</h3>
              <p className="text-muted-foreground">Past events will appear here.</p>
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

