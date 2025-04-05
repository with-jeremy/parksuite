"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"

const supabase = createClient()

export function ProfileForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)

        const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

        if (error) throw error

        setProfile(data)
      } catch (error: any) {
        console.error("Error loading profile:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!profile) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const { error } = await supabase
        .from("users")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          bio: profile.bio,
          is_host: profile.is_host,
        })
        .eq("id", userId)

      if (error) throw error

      setSuccess(true)
      router.refresh() // Refresh the page to update server components
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading profile...</div>
  }

  if (!profile) {
    return <div className="text-center py-4 text-red-500">Could not load profile</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 p-4 rounded-md text-red-800">{error}</div>}

      {success && <div className="bg-green-50 p-4 rounded-md text-green-800">Profile updated successfully!</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            value={profile.first_name}
            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            value={profile.last_name}
            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
        <p className="text-sm text-muted-foreground">
          Email cannot be changed. Contact support if you need to update your email.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={profile.phone || ""}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={profile.bio || ""}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Tell us a bit about yourself"
          className="min-h-[100px]"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_host"
          checked={profile.is_host}
          onCheckedChange={(checked) => setProfile({ ...profile, is_host: checked as boolean })}
        />
        <Label htmlFor="is_host">I want to be a host and list parking spaces</Label>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  )
}

