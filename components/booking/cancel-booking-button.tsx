"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { cancelBooking } from "@/lib/actions/booking-actions"

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const handleCancel = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await cancelBooking(bookingId)

      if (result.error) {
        setError(result.error)
        return
      }

      // Close the dialog and refresh the page
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error("Error cancelling booking:", err)
      setError(err.message || "Failed to cancel booking")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            Cancel Booking
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your booking. You will receive a full refund as per our cancellation policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm">{error}</div>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleCancel()
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground"
            >
              {loading ? "Cancelling..." : "Yes, Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

