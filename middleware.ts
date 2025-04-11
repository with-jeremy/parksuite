import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Check if we have a code in the root URL and redirect it properly to auth/callback
  const { pathname, searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (pathname === '/' && code) {
    // Redirect to the correct callback URL with the code
    const callbackUrl = new URL('/auth/callback', request.url)
    searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value)
    })
    return Response.redirect(callbackUrl)
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}