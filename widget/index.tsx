import React from "react";
import ReactDOM from "react-dom/client";
import ChatbotWidget from "./ChatbotWidget";

interface ChatbotWidgetConfig {
  chatbotId: string;
  apiUrl: string;
  authToken?: string;
  frontendUrl?: string; // Optional frontend URL for OAuth endpoints (defaults to auto-detect from script source)
  width?: number; // Optional widget width in pixels (default: 380)
  height?: number; // Optional widget height in pixels (default: 600)
}

// Helper function to wait for DOM to be ready
function waitForDOM(callback: () => void) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

// Global function to initialize the widget
(window as any).initChatWidget = function(config: ChatbotWidgetConfig) {
  try {
    if (!config || !config.chatbotId || !config.apiUrl) {
      console.error('ChatWidget: chatbotId and apiUrl are required');
      return;
    }

    waitForDOM(() => {
      try {
        // Remove existing widget if present
        const existingContainer = document.getElementById('chat-widget-root');
        if (existingContainer) {
          existingContainer.remove();
        }

        // Create container
        const container = document.createElement("div");
        container.id = "chat-widget-root";
        document.body.appendChild(container);

        // Render widget
        const root = ReactDOM.createRoot(container);
        root.render(
          React.createElement(ChatbotWidget, { config: config })
        );
      } catch (error) {
        console.error('ChatWidget: Error initializing widget:', error);
      }
    });
  } catch (error) {
    console.error('ChatWidget: Error in initChatWidget:', error);
  }
};

// Auto-initialize if config is already available
waitForDOM(() => {
  const existingConfig = (window as any).__CHAT_WIDGET_CONFIG__;
  if (existingConfig && existingConfig.chatbotId && existingConfig.apiUrl) {
    (window as any).initChatWidget(existingConfig);
  }
});
