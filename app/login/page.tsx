import { AuthForm } from "@/components/auth-form"
import { MainNav } from "@/components/main-nav"
import Link from "next/link"
import { Car } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
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
            <h1 className="text-2xl font-bold tracking-tight">Welcome to ParkSuite</h1>
            <p className="text-muted-foreground mt-2">Sign in or create an account to continue</p>
          </div>
          <AuthForm />
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

