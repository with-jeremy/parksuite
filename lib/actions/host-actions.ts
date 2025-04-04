"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function createAvailability(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Extract form data
  const parkingSpotId = formData.get("parkingSpotId") as string
  const date = formData.get("date") as string
  const isAvailable = formData.get("isAvailable") === "true"
  const price = Number.parseFloat(formData.get("price") as string)
  const notes = formData.get("notes") as string

  // Validate required fields
  if (!parkingSpotId || !date) {
    return { error: "Missing required fields" }
  }

  try {
    // Verify ownership
    const { data: parkingSpot, error: fetchError } = await supabase
      .from("parking_spots")
      .select("owner_id")
      .eq("id", parkingSpotId)
      .single()

    if (fetchError) throw fetchError

    if (parkingSpot.owner_id !== session.user.id) {
      return { error: "Not authorized to update this parking spot" }
    }

    // Create availability - Changed from "parking_spot_availability" to "availability"
    const { data, error } = await supabase
      .from("availability")
      .insert({
        parking_spot_id: parkingSpotId,
        date,
        is_available: isAvailable,
        price_override: !isNaN(price) ? price : null,
        notes: notes || null,
      })
      .select("id")
      .single()

    if (error) throw error

    // Revalidate paths
    revalidatePath(`/host/dashboard/listings/${parkingSpotId}/availability`)

    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("Error creating availability:", error)
    return { error: error.message }
  }
}

export async function updateAvailability(availabilityId: string, formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Extract form data
  const parkingSpotId = formData.get("parkingSpotId") as string
  const date = formData.get("date") as string
  const isAvailable = formData.get("isAvailable") === "true"
  const price = Number.parseFloat(formData.get("price") as string)
  const notes = formData.get("notes") as string

  // Validate required fields
  if (!parkingSpotId || !date) {
    return { error: "Missing required fields" }
  }

  try {
    // Verify ownership
    const { data: availability, error: fetchError } = await supabase
      // Changed from "parking_spot_availability" to "availability"
      .from("availability")
      .select("parking_spot_id")
      .eq("id", availabilityId)
      .single()

    if (fetchError) throw fetchError

    const { data: parkingSpot, error: spotError } = await supabase
      .from("parking_spots")
      .select("owner_id")
      .eq("id", availability.parking_spot_id)
      .single()

    if (spotError) throw spotError

    if (parkingSpot.owner_id !== session.user.id) {
      return { error: "Not authorized to update this availability" }
    }

    // Update availability - Changed from "parking_spot_availability" to "availability"
    const { error } = await supabase
      .from("availability")
      .update({
        date,
        is_available: isAvailable,
        price_override: !isNaN(price) ? price : null,
        notes: notes || null,
      })
      .eq("id", availabilityId)

    if (error) throw error

    // Revalidate paths
    revalidatePath(`/host/dashboard/listings/${parkingSpotId}/availability`)

    return { success: true }
  } catch (error: any) {
    console.error("Error updating availability:", error)
    return { error: error.message }
  }
}

export async function deleteAvailability(availabilityId: string) {
  const supabase = createServerActionClient({ cookies })

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  try {
    // Verify ownership
    const { data: availability, error: fetchError } = await supabase
      // Changed from "parking_spot_availability" to "availability"
      .from("availability")
      .select("parking_spot_id")
      .eq("id", availabilityId)
      .single()

    if (fetchError) throw fetchError

    const { data: parkingSpot, error: spotError } = await supabase
      .from("parking_spots")
      .select("owner_id")
      .eq("id", availability.parking_spot_id)
      .single()

    if (spotError) throw spotError

    if (parkingSpot.owner_id !== session.user.id) {
      return { error: "Not authorized to delete this availability" }
    }

    // Delete availability - Changed from "parking_spot_availability" to "availability"
    const { error } = await supabase.from("availability").delete().eq("id", availabilityId)

    if (error) throw error

    // Revalidate paths
    revalidatePath(`/host/dashboard/listings/${availability.parking_spot_id}/availability`)

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting availability:", error)
    return { error: error.message }
  }
}

