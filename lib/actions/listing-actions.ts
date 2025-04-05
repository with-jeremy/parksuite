"use server"

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function createListing(formData: FormData) {
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
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
  const zipCode = formData.get("zip_code") as string
  const type = formData.get("type") as string
  const pricePerDay = Number.parseFloat(formData.get("price_per_day") as string)
  const spacesAvailable = Number.parseInt(formData.get("spaces_available") as string)
  const isActive = formData.get("is_active") === "on"

  // Validate required fields
  if (!title || !address || !city || !state || !zipCode || !type || isNaN(pricePerDay)) {
    return { error: "Missing required fields" }
  }

  try {
    // Insert new listing
    const { data, error } = await supabase
      .from("parking_spots")
      .insert({
        owner_id: user.id,
        title,
        description,
        address,
        city,
        state,
        zip_code: zipCode,
        type,
        price_per_day: pricePerDay,
        spaces_available: spacesAvailable,
        is_active: isActive,
      })
      .select("id")
      .single()

    if (error) throw error

    // Get selected amenities
    const amenityIds = formData.getAll("amenities") as string[]

    // Insert amenities if any selected
    if (amenityIds.length > 0) {
      const amenityRecords = amenityIds.map((amenityId) => ({
        parking_spot_id: data.id,
        amenity_id: amenityId,
      }))

      const { error: amenityError } = await supabase.from("parking_spot_amenities").insert(amenityRecords)

      if (amenityError) throw amenityError
    }

    // Revalidate paths
    revalidatePath("/host/dashboard")
    revalidatePath("/listings")

    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("Error creating listing:", error)
    return { error: error.message }
  }
}

export async function updateListing(listingId: string, formData: FormData) {
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
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
  const zipCode = formData.get("zip_code") as string
  const type = formData.get("type") as string
  const pricePerDay = Number.parseFloat(formData.get("price_per_day") as string)
  const spacesAvailable = Number.parseInt(formData.get("spaces_available") as string)
  const isActive = formData.get("is_active") === "on"

  // Validate required fields
  if (!title || !address || !city || !state || !zipCode || !type || isNaN(pricePerDay)) {
    return { error: "Missing required fields" }
  }

  try {
    // Verify ownership
    const { data: listing, error: fetchError } = await supabase
      .from("parking_spots")
      .select("owner_id")
      .eq("id", listingId)
      .single()

    if (fetchError) throw fetchError

    if (listing.owner_id !== user.id) {
      return { error: "Not authorized to update this listing" }
    }

    // Update listing
    const { error } = await supabase
      .from("parking_spots")
      .update({
        title,
        description,
        address,
        city,
        state,
        zip_code: zipCode,
        type,
        price_per_day: pricePerDay,
        spaces_available: spacesAvailable,
        is_active: isActive,
      })
      .eq("id", listingId)

    if (error) throw error

    // Get selected amenities
    const amenityIds = formData.getAll("amenities") as string[]

    // Delete existing amenities
    const { error: deleteError } = await supabase
      .from("parking_spot_amenities")
      .delete()
      .eq("parking_spot_id", listingId)

    if (deleteError) throw deleteError

    // Insert new amenities if any selected
    if (amenityIds.length > 0) {
      const amenityRecords = amenityIds.map((amenityId) => ({
        parking_spot_id: listingId,
        amenity_id: amenityId,
      }))

      const { error: amenityError } = await supabase.from("parking_spot_amenities").insert(amenityRecords)

      if (amenityError) throw amenityError
    }

    // Revalidate paths
    revalidatePath("/host/dashboard")
    revalidatePath(`/listings/${listingId}`)
    revalidatePath("/listings")

    return { success: true }
  } catch (error: any) {
    console.error("Error updating listing:", error)
    return { error: error.message }
  }
}

export async function deleteListing(listingId: string) {
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
    const { data: listing, error: fetchError } = await supabase
      .from("parking_spots")
      .select("owner_id")
      .eq("id", listingId)
      .single()

    if (fetchError) throw fetchError

    if (listing.owner_id !== user.id) {
      return { error: "Not authorized to delete this listing" }
    }

    // Delete listing (this will cascade to images and amenities)
    const { error } = await supabase.from("parking_spots").delete().eq("id", listingId)

    if (error) throw error

    // Revalidate paths
    revalidatePath("/host/dashboard")
    revalidatePath("/listings")

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting listing:", error)
    return { error: error.message }
  }
}

