import { clerkMiddleware } from '@clerk/nextjs/server'

// Add a handler function and empty options
export default clerkMiddleware((auth, req) => {
  // This is the minimum middleware function - it doesn't do anything special
  // but it prevents Clerk from trying to use custom domains
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}