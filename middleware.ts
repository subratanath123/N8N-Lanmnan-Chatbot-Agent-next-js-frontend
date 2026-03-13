import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/openwebui",
    "/api/chat",
    "/api/n8n",
    "/api/test",
    "/api/google-oauth",  // Google OAuth endpoints - must be public
    "/api/google-oauth/authorize",
    "/api/google-oauth/authorize-chatbot",
    "/api/google-oauth/callback",
    "/api/google-oauth/callback-chatbot",
    "/api/google-oauth/get-tokens",
    "/api/google-oauth/refresh-token",
    "/auth/social/facebook/authorize",
    "/auth/social/facebook/callback",
    "/auth/social/twitter/authorize",
    "/auth/social/twitter/callback",
    "/oauth-success",
    "/oauth-success-chatbot", // Chatbot owner OAuth success page
    "/oauth-success-social",  // Social media OAuth success page
    "/oauth-error",
    "/projects/list",
    "/projects/new",
    "/train",
    "/widget-dist"
  ],
  
  // Routes that completely bypass Clerk (no auth check at all)
  ignoredRoutes: [
    "/api/webhook/clerk",
    "/api/google-oauth",  // This ensures OAuth routes bypass Clerk completely
    "/api/google-oauth/authorize",
    "/api/google-oauth/authorize-chatbot",
    "/api/google-oauth/callback",
    "/api/google-oauth/callback-chatbot",
    "/api/google-oauth/get-tokens",
    "/api/google-oauth/refresh-token",
    "/api/social-auth",
    "/auth/social/facebook/authorize",
    "/auth/social/facebook/callback",
    "/auth/social/twitter/authorize",
    "/auth/social/twitter/callback"
  ]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
