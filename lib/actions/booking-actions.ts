"use server"

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

// Helper function to validate and sanitize input
function validateBookingInput(formData: FormData) {
  const parkingSpotId = formData.get("parkingSpotId") as string
  const date = formData.get("date") as string
  const checkInTime = formData.get("checkInTime") as string
  const checkOutTime = formData.get("checkOutTime") as string

  // Parse numeric values safely
  let price = 0
  let serviceFee = 0
  let totalPrice = 0

  try {
    price = Number.parseFloat(formData.get("price") as string)
    serviceFee = Number.parseFloat(formData.get("serviceFee") as string)
    totalPrice = Number.parseFloat(formData.get("total") as string)
  } catch (e) {
    return { valid: false, error: "Invalid price format" }
  }

  // Validate required fields
  if (!parkingSpotId || !date || !checkInTime || !checkOutTime) {
    return { valid: false, error: "Missing required fields" }
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return { valid: false, error: "Invalid date format" }
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  if (!timeRegex.test(checkInTime) || !timeRegex.test(checkOutTime)) {
    return { valid: false, error: "Invalid time format" }
  }

  // Validate numeric values
  if (isNaN(price) || isNaN(serviceFee) || isNaN(totalPrice)) {
    return { valid: false, error: "Invalid price values" }
  }

  if (price < 0 || serviceFee < 0 || totalPrice < 0) {
    return { valid: false, error: "Price values cannot be negative" }
  }

  // Return validated data
  return {
    valid: true,
    data: {
      parkingSpotId,
      date,
      checkInTime,
      checkOutTime,
      price,
      serviceFee,
      totalPrice,
    },
  }
}

export async function createBooking(formData: FormData) {
  const supabase = await createClient({ cookies })

  // Check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.error("Error getting user:", userError)
    return { error: "Not authenticated" }
  }

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Validate input
  const validation = validateBookingInput(formData)
  if (!validation.valid) {
    return { error: validation.error }
  }

  const { parkingSpotId, date, checkInTime, checkOutTime, price, serviceFee, totalPrice } = validation.data

  try {
    // Check if the parking spot exists and is active
    const { data: parkingSpot, error: parkingSpotError } = await supabase
      .from("parking_spots")
      .select("id, is_active, owner_id, spaces_available")
      .eq("id", parkingSpotId)
      .single()

    if (parkingSpotError) {
      console.error("Error fetching parking spot:", parkingSpotError)
      return { error: "Parking spot not found" }
    }

    if (!parkingSpot.is_active) {
      return { error: "This parking spot is not available for booking" }
    }

    // Prevent booking your own parking spot
    if (parkingSpot.owner_id === user.id) {
      return { error: "You cannot book your own parking spot" }
    }

    // Check if the spot is available on the selected date
    const { data: availabilityData, error: availabilityError } = await supabase
      .from("availability")
      .select("is_available")
      .eq("parking_spot_id", parkingSpotId)
      .eq("date", date)
      .maybeSingle()

    if (availabilityError && availabilityError.code !== "PGRST116") {
      console.error("Error checking availability:", availabilityError)
      return { error: "Error checking availability" }
    }

    // If there's an availability record and it's set to not available
    if (availabilityData && !availabilityData.is_available) {
      return { error: "This parking spot is not available on the selected date" }
    }

    // Check if there are any conflicting bookings
    const { data: existingBookings, error: bookingCheckError } = await supabase
      .from("bookings")
      .select("id")
      .eq("parking_spot_id", parkingSpotId)
      .eq("booking_date", date)
      .in("status", ["pending", "confirmed"])

    if (bookingCheckError) {
      console.error("Error checking existing bookings:", bookingCheckError)
      return { error: "Error checking existing bookings" }
    }

    // Check if there are enough spaces available
    if (existingBookings && existingBookings.length >= parkingSpot.spaces_available) {
      return { error: "This parking spot is fully booked for the selected date" }
    }

    // Create the booking with a unique ID
    const bookingId = uuidv4()
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        id: bookingId,
        user_id: user.id,
        parking_spot_id: parkingSpotId,
        booking_date: date,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        price_per_day: price,
        service_fee: serviceFee,
        total_price: totalPrice,
        status: "pending", // Start as pending, can be confirmed later
        has_review: false,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating booking:", error)
      return { error: "Failed to create booking" }
    }

    // Revalidate paths
    revalidatePath("/dashboard/bookings")
    revalidatePath(`/listings/${parkingSpotId}`)

    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("Unexpected error creating booking:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient({ cookies })

  // Check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.error("Error getting user:", userError)
    return { error: "Not authenticated" }
  }

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Verify ownership
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("user_id, parking_spot_id, booking_date, check_in_time, status")
      .eq("id", bookingId)
      .single()

    if (fetchError) {
      console.error("Error fetching booking:", fetchError)
      return { error: "Booking not found" }
    }

    if (booking.user_id !== user.id) {
      return { error: "Not authorized to cancel this booking" }
    }

    if (booking.status === "cancelled") {
      return { error: "This booking is already cancelled" }
    }

    if (booking.status === "completed") {
      return { error: "Cannot cancel a completed booking" }
    }

    // Check if booking is cancellable (more than 24 hours before)
    const bookingDate = new Date(booking.booking_date)
    const checkInTime = booking.check_in_time.split(":")
    bookingDate.setHours(Number.parseInt(checkInTime[0]), Number.parseInt(checkInTime[1]), 0, 0)

    const now = new Date()
    const timeDiff = bookingDate.getTime() - now.getTime()
    const hoursDiff = timeDiff / (1000 * 60 * 60)

    if (hoursDiff <= 24) {
      return { error: "Bookings can only be cancelled more than 24 hours in advance" }
    }

    // Cancel the booking
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId)

    if (error) {
      console.error("Error cancelling booking:", error)
      return { error: "Failed to cancel booking" }
    }

    // Revalidate paths
    revalidatePath("/dashboard/bookings")
    revalidatePath(`/dashboard/bookings/${bookingId}`)
    revalidatePath(`/listings/${booking.parking_spot_id}`)

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error cancelling booking:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function createReview(formData: FormData) {
  const supabase = await createClient({ cookies })

  // Check if user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.error("Error getting user:", userError)
    return { error: "Not authenticated" }
  }

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Extract form data
  const bookingId = formData.get("bookingId") as string
  const ratingStr = formData.get("rating") as string
  const comment = formData.get("comment") as string

  // Validate input
  if (!bookingId || !ratingStr || !comment) {
    return { error: "Missing required fields" }
  }

  const rating = Number.parseInt(ratingStr)
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5" }
  }

  // Sanitize comment (basic)
  const sanitizedComment = comment.trim().slice(0, 1000) // Limit to 1000 chars

  try {
    // Verify booking ownership and status
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("user_id, parking_spot_id, status, has_review")
      .eq("id", bookingId)
      .single()

    if (fetchError) {
      console.error("Error fetching booking:", fetchError)
      return { error: "Booking not found" }
    }

    if (booking.user_id !== user.id) {
      return { error: "Not authorized to review this booking" }
    }

    if (booking.status !== "completed") {
      return { error: "Can only review completed bookings" }
    }

    if (booking.has_review) {
      return { error: "You have already reviewed this booking" }
    }

    // Create the review with a unique ID
    const reviewId = uuidv4()
    const { error: reviewError } = await supabase.from("reviews").insert({
      id: reviewId,
      user_id: user.id,
      parking_spot_id: booking.parking_spot_id,
      booking_id: bookingId,
      rating,
      comment: sanitizedComment,
    })

    if (reviewError) {
      console.error("Error creating review:", reviewError)
      return { error: "Failed to create review" }
    }

    // Update booking to mark as reviewed
    const { error: updateError } = await supabase.from("bookings").update({ has_review: true }).eq("id", bookingId)

    if (updateError) {
      console.error("Error updating booking:", updateError)
      return { error: "Failed to update booking" }
    }

    // Revalidate paths
    revalidatePath("/dashboard/bookings")
    revalidatePath(`/dashboard/bookings/${bookingId}`)
    revalidatePath(`/listings/${booking.parking_spot_id}`)

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error creating review:", error)
    return { error: "An unexpected error occurred" }
  }
}

