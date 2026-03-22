import React from "react";
import ReactDOM from "react-dom/client";
import ChatbotWidget from "./ChatbotWidget";

interface ChatbotWidgetConfig {
  chatbotId: string;
  apiUrl: string;
  authToken?: string;
  /**
   * Token identifying the currently logged-in user on the *embedding website*.
   * Forwarded with every message so workflow action endpoints can identify the user.
   *
   * @example — server-rendered page
   *   window.ChatWidgetConfig = {
   *     chatbotId: 'support-bot',
   *     apiUrl:    'https://api.yourplatform.com',
   *     userToken: '<?php echo $user->getJWT() ?>'
   *   };
   *
   * @example — SPA / React
   *   window.ChatWidgetConfig = {
   *     chatbotId: 'support-bot',
   *     apiUrl:    'https://api.yourplatform.com',
   *     userToken: localStorage.getItem('auth_token') ?? undefined
   *   };
   *
   * @example — dynamically refreshed token
   *   window.initChatWidget({
   *     chatbotId: 'support-bot',
   *     apiUrl:    'https://api.yourplatform.com',
   *     userToken: await getAccessToken()
   *   });
   */
  userToken?: string;
  frontendUrl?: string;
  width?: number;
  height?: number;
  model?: string;
}

// Helper: wait for DOM to be ready
function waitForDOM(callback: () => void) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

function mountWidget(config: ChatbotWidgetConfig) {
  if (!config || !config.chatbotId || !config.apiUrl) {
    console.error('[ChatWidget] chatbotId and apiUrl are required');
    return;
  }

  // Remove existing widget if present (allows re-init with updated userToken)
  const existing = document.getElementById('chat-widget-root');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'chat-widget-root';
  document.body.appendChild(container);

  ReactDOM.createRoot(container).render(
    React.createElement(ChatbotWidget, { config })
  );
}

/**
 * Imperative init — call this directly from JavaScript.
 *
 * @example
 *   window.initChatWidget({
 *     chatbotId: 'support-bot',
 *     apiUrl:    'https://api.yourplatform.com',
 *     userToken: getUserJWT()   // optional: your site's logged-in user token
 *   });
 */
(window as any).initChatWidget = function (config: ChatbotWidgetConfig) {
  try {
    waitForDOM(() => {
      try {
        mountWidget(config);
      } catch (err) {
        console.error('[ChatWidget] mount error:', err);
      }
    });
  } catch (err) {
    console.error('[ChatWidget] init error:', err);
  }
};

/**
 * Declarative init — set window.ChatWidgetConfig before the script loads.
 * Supports both naming conventions:
 *   - window.ChatWidgetConfig          ← preferred (matches our docs)
 *   - window.__CHAT_WIDGET_CONFIG__    ← legacy
 *
 * @example
 *   <script>
 *     window.ChatWidgetConfig = {
 *       chatbotId: 'support-bot',
 *       apiUrl:    'https://api.yourplatform.com',
 *       userToken: '<?php echo $currentUser->jwt ?>'
 *     };
 *   </script>
 *   <script src="https://yourplatform.com/widget/chat-widget.iife.js"></script>
 */
waitForDOM(() => {
  const config =
    (window as any).ChatWidgetConfig ||
    (window as any).__CHAT_WIDGET_CONFIG__;

  if (config?.chatbotId && config?.apiUrl) {
    try {
      mountWidget(config);
    } catch (err) {
      console.error('[ChatWidget] auto-init error:', err);
    }
  }
});
