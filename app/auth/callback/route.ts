import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin
  
  // If the code is missing, redirect to login page
  if (!code) {
    console.error("Missing code in callback URL")
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  try {
    const cookieStore = cookies()
    const supabase = await createClient({ cookies: () => cookieStore })
    
    // Exchange the code for a session
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("Error exchanging code for session:", error.message, error.status)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
    
    // Log successful authentication
    console.log("Authentication successful, redirecting to dashboard")
    
    // Successful authentication, redirect to profile page
    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (error: any) {
    console.error("Unexpected error during authentication:", error)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message || "An unexpected error occurred")}`
    )
  }
}

