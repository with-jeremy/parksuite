"use server"

import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Venue Actions
export async function createVenue(formData: FormData) {
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
  const supabase = await createClient({ cookies })

  // Check if user is authenticated and is an admin
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Not authenticated" }
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
import { v4 as uuidv4 } from "uuid"

export async function createEvent(formData: FormData) {
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
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const date = formData.get("date") as string
    const start_time = formData.get("start_time") as string
    const end_time = formData.get("end_time") as string
    const venue_id = formData.get("venue_id") as string
    const event_type_id = formData.get("event_type_id") as string
    const image_url = formData.get("image_url") as string
    const is_active = formData.get("is_active") === "true"

    // Validate required fields
    if (!name || !date || !start_time || !end_time || !venue_id || !event_type_id) {
      return { error: "Missing required fields" }
    }

    // Create a new event ID
    const eventId = uuidv4()

    // Insert the new event into the database
    const { error } = await supabase
      .from("events")
      .insert({
        id: eventId,
        name,
        description,
        date,
        start_time,
        end_time,
        venue_id,
        event_type_id,
        image_url,
        is_active,
      })

    if (error) {
      console.error("Error creating event:", error)
      return { error: "Failed to create event" }
    }

    revalidatePath("/admin/events")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error creating event:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = await createClient({ cookies })

  // Validate user authentication
  const { data: { session }, error: userError } = await supabase.auth.getSession()

  if (userError) {
    console.error("Error getting user:", userError)
    return { error: "Not authenticated" }
  }

  if (!session) {
    return { error: "Not authenticated" }
  }

  // Check if user is an admin
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()

  if (!user?.is_admin) {
    return { error: "Not authorized" }
  }

  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const date = formData.get("date") as string
    const start_time = formData.get("start_time") as string
    const end_time = formData.get("end_time") as string
    const venue_id = formData.get("venue_id") as string
    const event_type_id = formData.get("event_type_id") as string
    const image_url = formData.get("image_url") as string
    const is_active = formData.get("is_active") === "true"

    // Validate required fields
    if (!name || !date || !start_time || !end_time || !venue_id || !event_type_id) {
      return { error: "Missing required fields" }
    }

    // Update the event in the database
    const { error } = await supabase
      .from("events")
      .update({
        name,
        description,
        date,
        start_time,
        end_time,
        venue_id,
        event_type_id,
        image_url,
        is_active,
      })
      .eq("id", eventId)

    if (error) {
      console.error("Error updating event:", error)
      return { error: "Failed to update event" }
    }

    revalidatePath("/admin/events")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error updating event:", error)
    return { error: "An unexpected error occurred" }
  }
}

