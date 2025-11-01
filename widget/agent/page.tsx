"use client";
import React from "react";
import ReactDOM from "react-dom/client";
import ChatService from "../../src/component/ChatService";

const config = (window as any).__CHAT_WIDGET_CONFIG__ || {};

const container = document.createElement("div");
container.id = "chat-widget-root";
document.body.appendChild(container);

const root = ReactDOM.createRoot(container);
root.render(<ChatService projectId={config.projectId}/>);
