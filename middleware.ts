import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    "/",
    "/openwebui",
    "/api/chat",
    "/api/n8n",
    "/api/test",  // Add test API for debugging
    "/projects/list",
    "/projects/new",
    "/train",
    "/widget-dist"  // Allow widget files to be accessed publicly
  ],
  
  // Routes that can be accessed while signed out, but also show user info when signed in
  ignoredRoutes: [
    "/api/webhook/clerk"
  ]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
