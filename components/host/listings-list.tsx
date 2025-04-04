"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Edit, Trash, Eye, ToggleLeft, ToggleRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ParkingSpot = {
  id: string
  title: string
  price_per_day: number
  type: string
  is_active: boolean
  city: string
  state: string
  created_at: string
  images: { image_url: string }[]
}

export function ListingsList() {
  const [listings, setListings] = useState<ParkingSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error("Not authenticated")

        // Get listings with their primary image
        const { data, error } = await supabase
          .from("parking_spots")
          .select(`
            id, 
            title, 
            price_per_day, 
            type, 
            is_active, 
            city, 
            state, 
            created_at,
            images:parking_spot_images(image_url)
          `)
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        setListings(data || [])
      } catch (err: any) {
        console.error("Error fetching listings:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  const toggleListingStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("parking_spots").update({ is_active: !currentStatus }).eq("id", id)

      if (error) throw error

      // Update local state
      setListings(listings.map((listing) => (listing.id === id ? { ...listing, is_active: !currentStatus } : listing)))
    } catch (err: any) {
      console.error("Error toggling listing status:", err)
      setError(err.message)
    }
  }

  const deleteListing = async (id: string) => {
    try {
      const { error } = await supabase.from("parking_spots").delete().eq("id", id)

      if (error) throw error

      // Update local state
      setListings(listings.filter((listing) => listing.id !== id))
      setDeletingId(null)
    } catch (err: any) {
      console.error("Error deleting listing:", err)
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading your listings...</div>
  }

  if (error) {
    return <div className="bg-red-50 p-4 rounded-md text-red-800">Error: {error}</div>
  }

  if (listings.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-2">No listings yet</h3>
        <p className="text-muted-foreground mb-4">Create your first parking spot listing to start earning.</p>
        <Button asChild>
          <Link href="/host/dashboard/listings/new">Create Your First Listing</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <Card key={listing.id} className="overflow-hidden">
          <div className="aspect-video relative">
            <Image
              src={listing.images?.[0]?.image_url || "/placeholder.svg?height=200&width=300"}
              alt={listing.title}
              fill
              className="object-cover"
            />
            <Badge className="absolute top-2 right-2" variant={listing.is_active ? "default" : "secondary"}>
              {listing.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold truncate">{listing.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {listing.city}, {listing.state} • {listing.type.charAt(0).toUpperCase() + listing.type.slice(1)}
            </p>
            <p className="font-medium mb-4">${listing.price_per_day.toFixed(2)} / day</p>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/listings/${listing.id}`}>
                  <Eye className="h-4 w-4 mr-1" /> View
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/host/dashboard/listings/${listing.id}`}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleListingStatus(listing.id, listing.is_active)}>
                {listing.is_active ? (
                  <>
                    <ToggleRight className="h-4 w-4 mr-1" /> Deactivate
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-4 w-4 mr-1" /> Activate
                  </>
                )}
              </Button>
              <AlertDialog open={deletingId === listing.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeletingId(listing.id)}
                  >
                    <Trash className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your listing and remove it from our
                      servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteListing(listing.id)}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

