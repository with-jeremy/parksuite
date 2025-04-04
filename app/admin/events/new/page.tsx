export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { MainNav } from "@/components/main-nav"
import { EventForm } from "@/components/admin/event-form"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export default async function NewEventPage() {
  const supabase = createServerSupabaseClient()

  // Check if user is logged in and is an admin
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Check if user is an admin
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()

  if (!user?.is_admin) {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1">
        <div className="container max-w-3xl py-8">
          <div className="mb-6">
            <Link
              href="/admin/events"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to events
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-6">Add New Event</h1>

          <EventForm />
        </div>
      </main>
      <footer className="border-t bg-background">
        <div className="container py-6 md:py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} ParkSpot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

