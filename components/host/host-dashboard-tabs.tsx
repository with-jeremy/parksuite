"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Car, Calendar, DollarSign, Star, Settings } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ListingsList } from "@/components/host/listings-list"
import { HostBookingsList } from "@/components/host/host-bookings-list"
import { HostEarnings } from "@/components/host/host-earnings"
import { HostReviews } from "@/components/host/host-reviews"

export function HostDashboardTabs() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("listings")

  return (
    <Tabs defaultValue="listings" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="listings" className="flex items-center gap-2">
          <Car className="h-4 w-4" />
          <span className="hidden sm:inline">Listings</span>
        </TabsTrigger>
        <TabsTrigger value="bookings" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Bookings</span>
        </TabsTrigger>
        <TabsTrigger value="earnings" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <span className="hidden sm:inline">Earnings</span>
        </TabsTrigger>
        <TabsTrigger value="reviews" className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          <span className="hidden sm:inline">Reviews</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="listings" className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Your Listings</h2>
          <Button asChild>
            <Link href="/host/dashboard/listings/new">Add New Listing</Link>
          </Button>
        </div>
        <ListingsList />
      </TabsContent>

      <TabsContent value="bookings" className="space-y-4">
        <h2 className="text-2xl font-semibold">Your Bookings</h2>
        <HostBookingsList />
      </TabsContent>

      <TabsContent value="earnings" className="space-y-4">
        <h2 className="text-2xl font-semibold">Your Earnings</h2>
        <HostEarnings />
      </TabsContent>

      <TabsContent value="reviews" className="space-y-4">
        <h2 className="text-2xl font-semibold">Your Reviews</h2>
        <HostReviews />
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <h2 className="text-2xl font-semibold">Host Settings</h2>
        <Card>
          <CardHeader>
            <CardTitle>Host Preferences</CardTitle>
            <CardDescription>Manage your host account settings and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Settings will be implemented in a future update.</p>
            <Button variant="outline" asChild>
              <Link href="/profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

