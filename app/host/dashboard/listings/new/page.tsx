export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { createClient } from "@/utils/supabase/client"
import { ListingForm } from "@/components/host/listing-form"

export default async function NewListingPage() {
  const supabase = await createClient()

  // Check if user is logged in
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Check if user is a host
  const { data: user } = await supabase.from("users").select("is_host").eq("id", session.user.id).single()

  // If not a host, redirect to become a host page
  if (!user?.is_host) {
    redirect("/host?becomeHost=true")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Create New Listing</h1>
          <ListingForm />
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} ParkSuite. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

