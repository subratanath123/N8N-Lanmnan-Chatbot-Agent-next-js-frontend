/**
 * Application configuration from environment variables
 */
export const appConfig = {
  chatbotName: process.env.NEXT_PUBLIC_CHATBOT_NAME || 'JadeAIBot',
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://subratapc.net',
  landingChatbotId: process.env.NEXT_PUBLIC_LANDING_CHATBOT_ID || 'public-landing-chatbot',
} as const;

/**
 * Check if the app is in "chatbot-only" mode
 * In this mode, only the landing chatbot is available, no dashboard or other features
 */
export const isChatbotOnlyMode = () => {
  return appConfig.chatbotName.toLowerCase() === 'lamnan';
};

/**
 * Check if a route is allowed in chatbot-only mode
 */
export const isRouteAllowedInChatbotMode = (pathname: string): boolean => {
  if (!isChatbotOnlyMode()) return true;
  
  // Only allow root page and auth routes in chatbot-only mode
  const allowedRoutes = [
    '/',
    '/api/google-oauth',
    '/api/clerk',
    '/api/webhook',
    '/api/attachments',
  ];
  
  return allowedRoutes.some(route => pathname === route || pathname.startsWith(route));
};
