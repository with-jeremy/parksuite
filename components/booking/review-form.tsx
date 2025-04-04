"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createReview } from "@/lib/actions/booking-actions"

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    if (comment.trim().length < 10) {
      setError("Please provide a comment of at least 10 characters")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append("bookingId", bookingId)
      formData.append("rating", rating.toString())
      formData.append("comment", comment)

      const result = await createReview(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      // Redirect back to the booking page
      router.push(`/dashboard/bookings/${bookingId}`)
      router.refresh()
    } catch (err: any) {
      console.error("Error submitting review:", err)
      setError(err.message || "Failed to submit review")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>}

      <div className="space-y-2">
        <label className="font-medium">Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 focus:outline-none"
            >
              <Star
                className={`h-8 w-8 ${
                  (hoverRating ? star <= hoverRating : star <= rating) ? "fill-primary text-primary" : "text-muted"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="comment" className="font-medium">
          Your Review
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this parking spot..."
          className="min-h-[150px]"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  )
}

