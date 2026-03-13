/**
 * Application configuration from environment variables
 */
export const appConfig = {
  chatbotName: process.env.NEXT_PUBLIC_CHATBOT_NAME || 'JadeAIBot',
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://subratapc.net',
  landingChatbotId: process.env.NEXT_PUBLIC_LANDING_CHATBOT_ID || 'public-landing-chatbot',
} as const;
