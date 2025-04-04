"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Venue Actions
export async function createVenue(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Check if user is authenticated and is an admin
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Check if user is an admin
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()

  if (!user?.is_admin) {
    return { error: "Not authorized" }
  }

  // Extract form data
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
  const zipCode = formData.get("zip_code") as string
  const capacity = Number.parseInt(formData.get("capacity") as string)
  const venueTypeId = formData.get("venue_type_id") as string
  const imageUrl = formData.get("image_url") as string
  const isActive = formData.get("is_active") === "true"

  // Validate required fields
  if (!name || !address || !city || !state || !zipCode || !venueTypeId) {
    return { error: "Missing required fields" }
  }

  try {
    // Insert new venue
    const { data, error } = await supabase
      .from("venues")
      .insert({
        name,
        description,
        address,
        city,
        state,
        zip_code: zipCode,
        capacity,
        venue_type_id: venueTypeId,
        image_url: imageUrl || null,
        is_active: isActive,
      })
      .select("id")
      .single()

    if (error) throw error

    // Revalidate paths
    revalidatePath("/admin/venues")

    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("Error creating venue:", error)
    return { error: error.message }
  }
}

export async function updateVenue(venueId: string, formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Check if user is authenticated and is an admin
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Check if user is an admin
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()

  if (!user?.is_admin) {
    return { error: "Not authorized" }
  }

  // Extract form data
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
  const zipCode = formData.get("zip_code") as string
  const capacity = Number.parseInt(formData.get("capacity") as string)
  const venueTypeId = formData.get("venue_type_id") as string
  const imageUrl = formData.get("image_url") as string
  const isActive = formData.get("is_active") === "true"

  // Validate required fields
  if (!name || !address || !city || !state || !zipCode || !venueTypeId) {
    return { error: "Missing required fields" }
  }

  try {
    // Update venue
    const { error } = await supabase
      .from("venues")
      .update({
        name,
        description,
        address,
        city,
        state,
        zip_code: zipCode,
        capacity,
        venue_type_id: venueTypeId,
        image_url: imageUrl || null,
        is_active: isActive,
      })
      .eq("id", venueId)

    if (error) throw error

    // Revalidate paths
    revalidatePath("/admin/venues")
    revalidatePath(`/admin/venues/${venueId}`)

    return { success: true }
  } catch (error: any) {
    console.error("Error updating venue:", error)
    return { error: error.message }
  }
}

// Event Actions
export async function createEvent(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Check if user is authenticated and is an admin
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Check if user is an admin
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()

  if (!user?.is_admin) {
    return { error: "Not authorized" }
  }

  // Extract form data
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const date = formData.get("date") as string
  const startTime = formData.get("start_time") as string
  const endTime = formData.get("end_time") as string
  const venueId = formData.get("venue_id") as string
  const eventTypeId = formData.get("event_type_id") as string
  const imageUrl = formData.get("image_url") as string
  const isActive = formData.get("is_active") === "true"

  // Validate required fields
  if (!name || !date || !startTime || !endTime || !venueId || !eventTypeId) {
    return { error: "Missing required fields" }
  }

  try {
    // Insert new event
    const { data, error } = await supabase
      .from("events")
      .insert({
        name,
        description,
        date,
        start_time: startTime,
        end_time: endTime,
        venue_id: venueId,
        event_type_id: eventTypeId,
        image_url: imageUrl || null,
        is_active: isActive,
      })
      .select("id")
      .single()

    if (error) throw error

    // Revalidate paths
    revalidatePath("/admin/events")

    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("Error creating event:", error)
    return { error: error.message }
  }
}

export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  // Check if user is authenticated and is an admin
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Check if user is an admin
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()

  if (!user?.is_admin) {
    return { error: "Not authorized" }
  }

  // Extract form data
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const date = formData.get("date") as string
  const startTime = formData.get("start_time") as string
  const endTime = formData.get("end_time") as string
  const venueId = formData.get("venue_id") as string
  const eventTypeId = formData.get("event_type_id") as string
  const imageUrl = formData.get("image_url") as string
  const isActive = formData.get("is_active") === "true"

  // Validate required fields
  if (!name || !date || !startTime || !endTime || !venueId || !eventTypeId) {
    return { error: "Missing required fields" }
  }

  try {
    // Update event
    const { error } = await supabase
      .from("events")
      .update({
        name,
        description,
        date,
        start_time: startTime,
        end_time: endTime,
        venue_id: venueId,
        event_type_id: eventTypeId,
        image_url: imageUrl || null,
        is_active: isActive,
      })
      .eq("id", eventId)

    if (error) throw error

    // Revalidate paths
    revalidatePath("/admin/events")
    revalidatePath(`/admin/events/${eventId}`)

    return { success: true }
  } catch (error: any) {
    console.error("Error updating event:", error)
    return { error: error.message }
  }
}

