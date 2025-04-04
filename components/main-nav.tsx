"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, User } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from '@/utils/supabase/client';
import { LogoutButton } from "./logout-button"

const navLinks = [
  { href: "/listings", label: "Find Parking" },
  { href: "/host", label: "Become a Host" },
]

export function MainNav() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true)
        const supabase = await createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setUser(null)
          return
        }

        setUser(data.session?.user || null)

        // Set up auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("Auth state changed:", event, session?.user?.email)
          setUser(session?.user || null)

          // Force a refresh when auth state changes
          if (event === "SIGNED_IN") {
            router.refresh()
          } else if (event === "SIGNED_OUT") {
            router.refresh()
          }
        })

        return () => {
          authListener.subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error in auth setup:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  return (
    <div className="flex items-center justify-between w-full">
      {/* Logo on the left */}
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/parksuite-dropper-logo-web-4dGRNQ7dML48d36q9AQoGbfedWyEY4.png"
          alt="ParkSuite Logo"
          width={24}
          height={24}
        />
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/parksuite-text-logo-m5GAj7JlD0R2QiQlt0gmHAentqEB37.png"
          alt="ParkSuite"
          width={120}
          height={24}
          className="h-6 object-contain"
        />
      </Link>

      {/* Centered navigation for larger screens */}
      <nav className="hidden md:flex items-center justify-center gap-6">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm font-medium hover:text-primary transition-colors">
            {link.label}
          </Link>
        ))}
        {!loading && user && (
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
            Dashboard
          </Link>
        )}
      </nav>

      {/* Auth buttons or user menu */}
      <div className="flex items-center gap-2">
        {!loading &&
          (user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/login">Login</Link>
            </Button>
          ))}

        {/* Hamburger menu on the right */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <div className="flex flex-col space-y-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-lg font-medium py-2 hover:text-primary transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!loading && user && (
                <Link
                  href="/dashboard"
                  className="text-lg font-medium py-2 hover:text-primary transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              {!loading &&
                (user ? (
                  <>
                    <Link
                      href="/profile"
                      className="text-lg font-medium py-2 hover:text-primary transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      Profile
                    </Link>
                    <div className="py-2">
                      <LogoutButton />
                    </div>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="text-lg font-medium py-2 hover:text-primary transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Link>
                ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

