export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { Calendar, Car, CreditCard, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNav } from "@/components/main-nav"
import { createClient } from "@/utils/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check if user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch user profile
  const { data: user } = await supabase
    .from("users")
    .select("first_name, last_name, is_host")
    .eq("id", session.user.id)
    .single()

  // Fetch upcoming bookings
  const today = new Date().toISOString().split("T")[0]
  const { data: upcomingBookings } = await supabase
    .from("bookings")
    .select(`
      id, booking_date, status,
      parking_spots(title, city, state)
    `)
    .eq("user_id", session.user.id)
    .gte("booking_date", today)
    .in("status", ["confirmed", "pending"])
    .order("booking_date", { ascending: true })
    .limit(3)

  // Fetch recent transactions
  const { data: recentTransactions } = await supabase
    .from("bookings")
    .select(`
      id, booking_date, total_price, status, created_at
    `)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // If user is a host, fetch their listings
  let hostListings = null
  if (user?.is_host) {
    const { data: listings } = await supabase
      .from("parking_spots")
      .select("id, title, is_active")
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(3)

    hostListings = listings
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
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground mb-8">Welcome back, {user?.first_name || session.user.email}!</p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingBookings?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Parking reservations</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/bookings">View All</Link>
                </Button>
              </CardFooter>
            </Card>

            {user?.is_host && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Listings</CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{hostListings?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Active parking spots</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/host/dashboard">Host Dashboard</Link>
                  </Button>
                </CardFooter>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Find Parking</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Search for parking spots near your destination</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/listings">Browse Listings</Link>
                </Button>
              </CardFooter>
            </Card>

            {!user?.is_host && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Become a Host</CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Earn money by renting out your parking space</p>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/host">Learn More</Link>
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          <div className="grid gap-6 mt-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
                <CardDescription>Your next parking reservations</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings && upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">{booking.parking_spots.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.parking_spots.city}, {booking.parking_spots.state} •{" "}
                            {new Date(booking.booking_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/bookings/${booking.id}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No upcoming bookings</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link href="/listings">Find Parking</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your recent booking payments</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions && recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">${transaction.total_price.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm capitalize">{transaction.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No recent transactions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {user?.is_host && hostListings && hostListings.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Your Listings</CardTitle>
                <CardDescription>Manage your parking spots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hostListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{listing.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Status: {listing.is_active ? "Active" : "Inactive"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/host/dashboard/listings/${listing.id}`}>Edit</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/host/dashboard">Go to Host Dashboard</Link>
                </Button>
              </CardFooter>
            </Card>
          )}
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

