"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

type Review = {
  id: string
  rating: number
  comment: string
  created_at: string
  user: {
    first_name: string
    last_name: string
    avatar_url: string | null
  }
  parking_spot: {
    title: string
  }
}

export function HostReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error("Not authenticated")

        // Get reviews for the host's parking spots
        const { data, error } = await supabase
          .from("reviews")
          .select(`
            id, 
            rating, 
            comment, 
            created_at,
            user:users(first_name, last_name, avatar_url),
            parking_spot:parking_spots(title)
          `)
          .order("created_at", { ascending: false })

        if (error) throw error

        setReviews(data || [])
      } catch (err: any) {
        console.error("Error fetching reviews:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [])

  if (loading) {
    return <div className="flex justify-center p-8">Loading your reviews...</div>
  }

  if (error) {
    return <div className="bg-red-50 p-4 rounded-md text-red-800">Error: {error}</div>
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-2">No reviews yet</h3>
        <p className="text-muted-foreground">Once guests stay at your parking spots, their reviews will appear here.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4 mb-4">
              <Avatar>
                <AvatarImage
                  src={review.user.avatar_url || undefined}
                  alt={`${review.user.first_name} ${review.user.last_name}`}
                />
                <AvatarFallback>
                  {review.user.first_name[0]}
                  {review.user.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {review.user.first_name} {review.user.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <p className="text-sm font-medium mb-2">{review.parking_spot.title}</p>

            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted"}`} />
              ))}
            </div>

            <p className="text-sm">{review.comment}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

