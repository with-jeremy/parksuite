"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    try {
      setLoading(true)
      const supabase = createClient()
      await supabase.auth.signOut()

      // Force a client-side navigation to the home page
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading} className="flex items-center gap-2">
      <LogOut className="h-4 w-4" />
      <span>{loading ? "Logging out..." : "Logout"}</span>
    </Button>
  )
}

