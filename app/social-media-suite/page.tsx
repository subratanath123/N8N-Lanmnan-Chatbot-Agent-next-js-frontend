"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "📘" },
  { id: "twitter", name: "X (Twitter)", icon: "🐦" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
];

const MODEL_OPTIONS = [
  { id: "gpt-4o", label: "GPT-4o (quality)" },
  { id: "gpt-4o-mini", label: "GPT-4o mini (fast)" },
];

interface Target {
  targetId: string;
  accountId: string;
  platform: string;
  displayName: string;
  pageId?: string;
  pageName?: string;
  username?: string;
}

interface UploadedMediaItem {
  mediaId?: string;
  mediaUrl?: string;
  mimeType?: string;
  fileName?: string;
  sizeBytes?: number;
  [key: string]: unknown;
}

const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const fileToText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });

export default function CreatePostPage() {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const aiFileInputRef = useRef<HTMLInputElement | null>(null);
  const [contentType, setContentType] = useState<"media" | "text">("text");
  const [postText, setPostText] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("facebook");
  const [scheduleOption, setScheduleOption] = useState("immediately");
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiModel, setAiModel] = useState<string>("gpt-4o");
  const [aiAttachments, setAiAttachments] = useState<File[]>([]);
  const isFacebookPreview = selectedPlatform === "facebook";
  const isTwitterPreview = selectedPlatform === "twitter";

  const addMediaFiles = (incoming: FileList | File[]) => {
    const next = Array.from(incoming).filter(
      (f) =>
        f.type.startsWith("image/") ||
        f.type.startsWith("video/") ||
        f.type === "application/pdf"
    );
    if (next.length === 0) return;
    setMediaFiles((prev) => {
      const seen = new Set(prev.map((f) => getFileKey(f)));
      const merged = [...prev];
      next.forEach((f) => {
        const key = getFileKey(f);
        if (!seen.has(key)) merged.push(f);
      });
      return merged;
    });
  };

  useEffect(() => {
    const urls: Record<string, string> = {};
    mediaFiles.forEach((file) => {
      urls[getFileKey(file)] = URL.createObjectURL(file);
    });
    setMediaPreviewUrls(urls);
    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mediaFiles]);

  useEffect(() => {
    setSelectedTargetIds([]);
  }, [selectedPlatform]);

  const handleGenerateFromAI = async () => {
    let promptText = aiPrompt.trim();
    if (!promptText || aiGenerating) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      setSubmitMessage({
        type: "error",
        text: "Backend URL is not configured. Please set NEXT_PUBLIC_BACKEND_URL.",
      });
      return;
    }

    setAiGenerating(true);
    setSubmitMessage(null);

    try {
      const platformName = PLATFORMS.find((p) => p.id === selectedPlatform)?.name || "your social media";
      const sessionId = `social_suite_${selectedPlatform}_${Date.now()}`;
      const systemInstruction =
        `You are a senior social media copywriter.\n` +
        `Write a concise, engaging ${platformName} post in plain text (no markdown, no emojis unless the user explicitly asks).\n` +
        `Keep it under 4 sentences and suitable for a business audience.`;

      // Process attachments
      type AttachmentItem = { type: string; data: string; name: string; mimeType: string };
      const attachmentData: AttachmentItem[] = [];

      for (const file of aiAttachments) {
        if (file.type.startsWith("image/")) {
          const base64 = await fileToBase64(file);
          attachmentData.push({ type: "image", data: base64, name: file.name, mimeType: file.type });
        } else if (
          file.type === "text/plain" ||
          file.type === "text/csv" ||
          file.type === "text/markdown" ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".csv") ||
          file.name.endsWith(".md")
        ) {
          const text = await fileToText(file);
          promptText += `\n\nAttached file "${file.name}":\n${text.slice(0, 4000)}`;
        } else {
          // For PDFs and other binaries just note them in the prompt
          promptText += `\n\n[Attached file: ${file.name} (${file.type || "unknown type"})]`;
        }
      }

      const payload: Record<string, unknown> = {
        role: "user",
        message: `${systemInstruction}\n\nUser brief:\n${promptText}`,
        sessionId,
        model: aiModel,
        ...(attachmentData.length > 0 ? { attachments: attachmentData } : {}),
      };

      const res = await fetch(`${backendUrl}/v1/api/n8n/anonymous/chat/generic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      let data: any;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = rawText;
      }

      if (!res.ok || (data && data.success === false)) {
        throw new Error(
          (data && (data.errorMessage || data.message)) ||
            `AI generator error: ${res.status}`
        );
      }

      let reply: string =
        (data?.result && typeof data.result === "object" && typeof data.result.response === "string"
          ? data.result.response
          : "") ||
        (typeof data?.result === "string" ? data.result : "") ||
        (typeof data?.output === "string" ? data.output : "") ||
        (typeof data?.message === "string" ? data.message : "") ||
        (typeof data?.response === "string" ? data.response : "") ||
        (typeof data?.answer === "string" ? data.answer : "") ||
        (typeof data?.responseContent === "string" ? data.responseContent : "");

      if (reply && reply.trim().startsWith("{")) {
        try {
          const inner = JSON.parse(reply);
          reply =
            (typeof inner.result === "string" ? inner.result : "") ||
            (typeof inner.output === "string" ? inner.output : "") ||
            (typeof inner.response === "string" ? inner.response : "") ||
            (typeof inner.message === "string" ? inner.message : "") ||
            (typeof inner.answer === "string" ? inner.answer : "") ||
            "";
        } catch {
          // keep original reply
        }
      }

      if (!reply || typeof reply !== "string" || !reply.trim()) {
        throw new Error("AI did not return usable content. Please try refining your prompt.");
      }

      setPostText(reply.trim());
      setContentType("text");
    } catch (err) {
      setSubmitMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to generate content. Please try again.",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSchedule = async () => {
    const isMediaMode = contentType === "media";
    if (isMediaMode && mediaFiles.length === 0) {
      setSubmitMessage({ type: "error", text: "Please attach at least one image or video." });
      return;
    }
    const content = postText.trim() || (isMediaMode ? "Media post" : "");
    if (!content && !isMediaMode) {
      setSubmitMessage({ type: "error", text: "Please enter post content." });
      return;
    }
    if (selectedTargetIds.length === 0) {
      setSubmitMessage({ type: "error", text: "Please select a target account." });
      return;
    }

    const immediate = scheduleOption === "immediately";
    let scheduledAt: string | undefined;
    if (!immediate && scheduleDate && scheduleTime) {
      scheduledAt = `${scheduleDate}T${scheduleTime}:00.000Z`;
    } else if (!immediate) {
      setSubmitMessage({ type: "error", text: "Please select date and time for scheduled post." });
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://subratapc.net";
    const token = await getToken?.();
    if (!token) {
      setSubmitMessage({ type: "error", text: "Please sign in to schedule posts." });
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);
    try {
      let uploadedMedia: UploadedMediaItem[] = [];
      if (mediaFiles.length > 0) {
        const uploadEndpoint =
          process.env.NEXT_PUBLIC_SOCIAL_MEDIA_UPLOAD_ENDPOINT ||
          `${backendUrl}/v1/api/social-media/upload`;
        const formData = new FormData();
        mediaFiles.forEach((file) => formData.append("files", file));
        formData.append("purpose", "social_post");

        const uploadRes = await fetch(uploadEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          throw new Error(
            uploadData?.message ||
              "Media upload failed. Ensure backend implements POST /v1/api/social-media/upload."
          );
        }

        if (Array.isArray(uploadData?.items)) {
          uploadedMedia = uploadData.items;
        } else if (Array.isArray(uploadData)) {
          uploadedMedia = uploadData;
        } else {
          throw new Error("Media upload response format is invalid. Expected items[] in response.");
        }
      }

      const res = await fetch(`${backendUrl}/v1/api/social-posts/schedule`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetIds: selectedTargetIds,
          content,
          scheduledAt: immediate ? undefined : scheduledAt,
          immediate,
          media: uploadedMedia,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setPostText("");
        setSelectedTargetIds([]);
        setMediaFiles([]);
        setSubmitMessage({
          type: "success",
          text: data.status === "published" ? "Post published!" : "Post scheduled successfully.",
        });
      } else {
        setSubmitMessage({
          type: "error",
          text: data.message || "Failed to schedule post. Ensure the backend implements POST /v1/api/social-posts/schedule.",
        });
      }
    } catch (err) {
      setSubmitMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to schedule post.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchTargets = async () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://subratapc.net";
      const token = await getToken?.();
      if (!token) {
        setTargetsLoading(false);
        return;
      }
      try {
        const url = `${backendUrl}/v1/api/social-accounts/targets?platform=${selectedPlatform}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setTargets(data.targets || []);
        } else {
          setTargets([]);
        }
      } catch {
        setTargets([]);
      } finally {
        setTargetsLoading(false);
      }
    };
    fetchTargets();
  }, [getToken, selectedPlatform]);

  return (
    <div className="social-suite-content">
      <div className="create-post-layout">
      <div className="create-post-main">
        <div className="ai-generator-card">
          <div className="ai-generator-header">
            <div>
              <div className="ai-generator-title">AI Content Assistant</div>
              <div className="ai-generator-subtitle">
                Describe your idea and we’ll draft a post for your selected platform.
              </div>
            </div>
            <div className="ai-generator-header-right">
              <div className="ai-model-select-wrap">
                  <label className="ai-model-label">AI model</label>
                  <div className="ai-model-toggle">
                    {MODEL_OPTIONS.map((m) => {
                      const active = aiModel === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`ai-model-option ${active ? "active" : ""}`}
                          onClick={() => setAiModel(m.id)}
                        >
                          <span className="ai-model-option-title">{m.id === "gpt-4o" ? "Quality" : "Fast"}</span>
                          <span className="ai-model-option-sub">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              <span className="ai-generator-badge">Powered by Jade AI</span>
            </div>
          </div>
          {/* Hidden file input for AI attachments */}
          <input
            ref={aiFileInputRef}
            type="file"
            accept="image/*,text/plain,text/csv,text/markdown,.txt,.csv,.md,.pdf"
            multiple
            className="hidden-file-input"
            onChange={(e) => {
              if (e.target.files) {
                const incoming = Array.from(e.target.files);
                setAiAttachments((prev) => {
                  const seen = new Set(prev.map((f) => getFileKey(f)));
                  return [...prev, ...incoming.filter((f) => !seen.has(getFileKey(f)))];
                });
              }
              e.currentTarget.value = "";
            }}
          />

          <div className="ai-textarea-wrap">
            <textarea
              className="ai-generator-textarea"
              placeholder="E.g. Announce our new AI chatbot feature for ecommerce stores, friendly and professional tone."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
            />
            <button
              type="button"
              className="ai-attach-trigger"
              onClick={() => aiFileInputRef.current?.click()}
              title="Attach files (images, text, CSV)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              Attach
            </button>
          </div>

          {aiAttachments.length > 0 && (
            <div className="ai-attach-chips">
              {aiAttachments.map((file) => {
                const key = getFileKey(file);
                const isImage = file.type.startsWith("image/");
                return (
                  <div key={key} className="ai-chip">
                    <span className="ai-chip-icon">{isImage ? "🖼" : "📄"}</span>
                    <span className="ai-chip-name" title={file.name}>
                      {file.name.length > 22 ? file.name.slice(0, 20) + "…" : file.name}
                    </span>
                    <button
                      type="button"
                      className="ai-chip-remove"
                      onClick={() =>
                        setAiAttachments((prev) => prev.filter((f) => getFileKey(f) !== key))
                      }
                      aria-label="Remove attachment"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="ai-generator-footer">
            <button
              type="button"
              className="ai-generate-btn"
              onClick={handleGenerateFromAI}
              disabled={aiGenerating || !aiPrompt.trim()}
            >
              {aiGenerating ? "Generating…" : "Generate content"}
            </button>
            <span className="ai-generator-hint">
              {aiAttachments.length > 0
                ? `${aiAttachments.length} file${aiAttachments.length > 1 ? "s" : ""} attached · text will be inserted below`
                : "The generated text will be inserted into the Post Text area below."}
            </span>
          </div>
        </div>

        <div className="content-type-tabs">
          <button
            type="button"
            className={`content-tab ${contentType === "media" ? "active" : ""}`}
            onClick={() => setContentType("media")}
          >
            Media Content
          </button>
          <button
            type="button"
            className={`content-tab ${contentType === "text" ? "active" : ""}`}
            onClick={() => setContentType("text")}
          >
            Text Content
          </button>
        </div>

        {contentType === "text" && (
          <div className="post-text-section">
            <label className="section-label">Post Text</label>
            <textarea
              className="post-textarea"
              placeholder="Enter your post text here..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              rows={6}
            />
          </div>
        )}

        {contentType === "media" && (
          <div className="media-upload-section">
            <label className="section-label">Media Content</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,application/pdf"
              multiple
              className="hidden-file-input"
              onChange={(e) => {
                if (e.target.files) addMediaFiles(e.target.files);
                e.currentTarget.value = "";
              }}
            />
            <div
              className={`media-dropzone ${isDragOver ? "drag-over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                addMediaFiles(e.dataTransfer.files);
              }}
            >
              <span>Drag and drop images, videos, or PDFs here, or click to browse</span>
            </div>
            {mediaFiles.length > 0 && (
              <div className="media-list">
                {mediaFiles.map((file, idx) => (
                  <div key={`${file.name}-${file.size}-${file.lastModified}-${idx}`} className="media-item">
                    <div className="media-preview-wrap">
                      {file.type.startsWith("image/") ? (
                        <img
                          src={mediaPreviewUrls[getFileKey(file)]}
                          alt={file.name}
                          className="media-preview"
                        />
                      ) : file.type.startsWith("video/") ? (
                        <video
                          src={mediaPreviewUrls[getFileKey(file)]}
                          className="media-preview"
                          controls
                        />
                      ) : file.type === "application/pdf" ? (
                        <iframe
                          src={mediaPreviewUrls[getFileKey(file)]}
                          title={file.name}
                          className="media-preview pdf-preview"
                        />
                      ) : (
                        <div className="media-preview fallback-preview">No preview</div>
                      )}
                    </div>
                    <span className="media-item-name">{file.name}</span>
                    <button
                      type="button"
                      className="remove-media-btn"
                      onClick={() =>
                        setMediaFiles((prev) =>
                          prev.filter(
                            (f) =>
                              !(
                                f.name === file.name &&
                                f.size === file.size &&
                                f.lastModified === file.lastModified
                              )
                          )
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="target-platforms-section">
          <label className="section-label">Where to publish</label>
          <p className="section-hint">Choose your social media profiles where you want to publish your post.</p>
          <div className="platform-icons">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`platform-btn ${selectedPlatform === p.id ? "active" : ""}`}
                onClick={() => setSelectedPlatform(p.id)}
                title={p.name}
              >
                <span className="platform-icon">{p.icon}</span>
                <span className="platform-name">{p.name}</span>
              </button>
            ))}
          </div>
          <select
            className="target-accounts-select"
            value={selectedTargetIds[0] ?? ""}
            onChange={(e) => setSelectedTargetIds(e.target.value ? [e.target.value] : [])}
          >
            <option value="">
              {targetsLoading ? "Loading accounts..." : targets.length === 0 ? "No accounts connected. Go to My Accounts to connect." : "Select your target account"}
            </option>
            {targets.map((t) => (
              <option key={t.targetId} value={t.targetId}>
                {t.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="schedule-section">
          <label className="section-label">When to publish</label>
          <p className="section-hint">Choose date and time to publish your post.</p>
          <select
            className="schedule-select"
            value={scheduleOption}
            onChange={(e) => setScheduleOption(e.target.value)}
          >
            <option value="immediately">Immediately</option>
            <option value="schedule">Schedule for later</option>
          </select>
          {scheduleOption === "schedule" && (
            <div className="datetime-picker" style={{ marginTop: "12px" }}>
              <input
                type="date"
                className="date-input"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
              <input
                type="time"
                className="time-input"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          )}
        </div>

        {submitMessage && (
          <div className={`submit-message ${submitMessage.type}`}>
            {submitMessage.text}
          </div>
        )}

        <button
          type="button"
          className="schedule-btn"
          onClick={handleSchedule}
          disabled={submitting}
        >
          {submitting ? "Scheduling..." : "Schedule"}
        </button>
      </div>

      <div className="live-preview-panel">
        <h3 className="preview-title">Live Preview</h3>
        <div className="preview-platform-tabs">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`preview-tab ${selectedPlatform === p.id ? "active" : ""}`}
              onClick={() => setSelectedPlatform(p.id)}
              title={p.name}
            >
              {p.icon}
            </button>
          ))}
        </div>
        <div className="preview-card">
          <div className="preview-header">
            <div className={`preview-avatar ${isTwitterPreview ? "twitter-avatar" : "facebook-avatar"}`}>
              {isTwitterPreview ? "X" : "FB"}
            </div>
            <div>
              <div className="preview-name">
                {isTwitterPreview ? "@your_handle" : "Your Facebook Page"}
              </div>
              <div className="preview-time">
                {isTwitterPreview ? "Now · Twitter preview" : "Now · Facebook preview"}
              </div>
            </div>
          </div>
          {postText.trim() && <div className="preview-body">{postText}</div>}
          {contentType === "media" && mediaFiles.length > 0 && (
            <div className="preview-media-grid">
              {mediaFiles.slice(0, 4).map((file) => (
                <div className="preview-media-item" key={`preview-${getFileKey(file)}`}>
                  {file.type.startsWith("image/") ? (
                    <img
                      src={mediaPreviewUrls[getFileKey(file)]}
                      alt={file.name}
                      className="preview-media-el"
                    />
                  ) : file.type.startsWith("video/") ? (
                    <video
                      src={mediaPreviewUrls[getFileKey(file)]}
                      className="preview-media-el"
                      controls
                      muted
                    />
                  ) : (
                    <div className="preview-pdf-tile">PDF: {file.name}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          {!postText.trim() && !(contentType === "media" && mediaFiles.length > 0) && (
            <div className="preview-body">Your post content will appear here...</div>
          )}
          <div className="preview-actions">
            {isTwitterPreview ? (
              <>
                <span>💬 Reply</span>
                <span>🔁 Repost</span>
                <span>❤️ Like</span>
              </>
            ) : (
              <>
                <span>👍 Like</span>
                <span>💬 Comment</span>
                <span>↗️ Share</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

    <style jsx>{`
        .create-post-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 28px;
        }

        .create-post-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ai-generator-card {
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: #f8fafc;
          padding: 16px 18px 14px;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ai-generator-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .ai-generator-header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .ai-generator-title {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
        }

        .ai-model-select-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .ai-model-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
        }

        .ai-model-toggle {
          display: inline-flex;
          padding: 3px;
          border-radius: 999px;
          background: #e2e8f0;
          border: 1px solid rgba(148, 163, 184, 0.8);
          gap: 3px;
        }

        .ai-model-option {
          border: none;
          border-radius: 999px;
          padding: 4px 10px;
          background: transparent;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 120px;
          transition: all 0.18s ease;
        }

        .ai-model-option-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .ai-model-option-sub {
          font-size: 11px;
        }

        .ai-model-option {
          color: #475569;
        }

        .ai-model-option.active {
          background: #0f172a;
          color: #e5e7eb;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.35);
        }

        .ai-generator-subtitle {
          font-size: 13px;
          color: #64748b;
        }

        .ai-generator-badge {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.08);
          color: #1d4ed8;
          white-space: nowrap;
        }

        .ai-textarea-wrap {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .ai-generator-textarea {
          width: 100%;
          border-radius: 10px 10px 0 0;
          border: 1px solid rgba(203, 213, 225, 0.9);
          border-bottom: none;
          padding: 10px 12px;
          font-size: 13px;
          resize: none;
          background: #ffffff;
          font-family: inherit;
        }

        .ai-generator-textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }

        .ai-attach-trigger {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid rgba(203, 213, 225, 0.9);
          border-top: none;
          border-radius: 0 0 10px 10px;
          padding: 6px 12px;
          background: #f8fafc;
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          width: 100%;
          justify-content: flex-start;
          transition: background 0.15s;
        }

        .ai-attach-trigger:hover {
          background: #f1f5f9;
          color: #1d4ed8;
        }

        .ai-attach-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }

        .ai-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px 4px 8px;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.18);
          font-size: 12px;
          color: #1e40af;
          max-width: 220px;
        }

        .ai-chip-icon {
          font-size: 13px;
          flex-shrink: 0;
        }

        .ai-chip-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ai-chip-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          font-size: 15px;
          line-height: 1;
          padding: 0;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          margin-left: 2px;
        }

        .ai-chip-remove:hover {
          color: #dc2626;
        }

        .ai-generator-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 4px;
        }

        .ai-generate-btn {
          border-radius: 999px;
          padding: 8px 18px;
          border: none;
          background: #0f172a;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .ai-generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .ai-generator-hint {
          font-size: 11px;
          color: #94a3b8;
        }

        .content-type-tabs {
          display: flex;
          gap: 8px;
        }

        .content-tab {
          padding: 10px 20px;
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 10px;
          background: #f8fafc;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .content-tab:hover {
          background: #f1f5f9;
        }

        .content-tab.active {
          background: #2563eb;
          color: #fff;
          border-color: #1d4ed8;
        }

        .section-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .section-hint {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 12px;
        }

        .post-textarea {
          width: 100%;
          padding: 14px 18px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 12px;
          font-size: 14px;
          color: #0f172a;
          background: #f8fafc;
          resize: vertical;
          font-family: inherit;
        }

        .post-textarea:focus {
          outline: none;
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .media-dropzone {
          border: 2px dashed rgba(148, 163, 184, 0.5);
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
          background: #f8fafc;
          cursor: pointer;
        }

        .media-dropzone.drag-over {
          border-color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
        }

        .hidden-file-input {
          display: none;
        }

        .media-list {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .media-item {
          display: grid;
          grid-template-columns: 120px 1fr auto;
          align-items: start;
          gap: 12px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 10px;
          padding: 10px 12px;
          background: #fff;
        }

        .media-preview-wrap {
          width: 120px;
          height: 90px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: #f8fafc;
        }

        .media-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border: none;
        }

        .pdf-preview {
          object-fit: contain;
          background: #fff;
        }

        .fallback-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: #64748b;
        }

        .media-item-name {
          font-size: 13px;
          color: #334155;
          word-break: break-all;
        }

        .remove-media-btn {
          border: 1px solid rgba(239, 68, 68, 0.4);
          background: #fff;
          color: #dc2626;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .platform-icons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .platform-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 12px;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .platform-btn:hover {
          background: #f1f5f9;
          border-color: #2563eb;
        }

        .platform-btn.active {
          background: rgba(37, 99, 235, 0.1);
          border-color: #2563eb;
          color: #1d4ed8;
        }

        .platform-icon {
          font-size: 24px;
        }

        .platform-name {
          font-size: 11px;
          font-weight: 600;
        }

        .target-accounts-select,
        .schedule-select {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 12px;
          font-size: 14px;
          color: #0f172a;
          background: #f8fafc;
        }

        .datetime-picker {
          display: flex;
          gap: 12px;
        }

        .date-input,
        .time-input {
          padding: 10px 14px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 10px;
          font-size: 14px;
        }

        .schedule-btn {
          padding: 14px 28px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
          align-self: flex-start;
        }

        .schedule-btn:hover:not(:disabled) {
          box-shadow: 0 16px 32px rgba(37, 99, 235, 0.3);
        }

        .schedule-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .submit-message {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
        }
        .submit-message.success {
          background: rgba(34, 197, 94, 0.15);
          color: #16a34a;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .submit-message.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .live-preview-panel {
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 16px;
          padding: 20px;
          background: #f8fafc;
          height: fit-content;
          position: sticky;
          top: 24px;
        }

        .preview-title {
          margin: 0 0 16px;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }

        .preview-platform-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .preview-tab {
          width: 40px;
          height: 40px;
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 10px;
          background: #fff;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-tab.active {
          background: #2563eb;
          border-color: #1d4ed8;
        }

        .preview-card {
          background: #fff;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }

        .preview-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .preview-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }
        .preview-avatar.facebook-avatar {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }
        .preview-avatar.twitter-avatar {
          background: linear-gradient(135deg, #0f172a, #334155);
        }

        .preview-name {
          font-weight: 600;
          font-size: 14px;
          color: #0f172a;
        }

        .preview-time {
          font-size: 12px;
          color: #64748b;
        }

        .preview-body {
          font-size: 14px;
          color: #334155;
          line-height: 1.5;
          margin-bottom: 12px;
          white-space: pre-wrap;
        }
        .preview-media-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 12px;
        }
        .preview-media-item {
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: #f8fafc;
          min-height: 110px;
        }
        .preview-media-el {
          width: 100%;
          height: 100%;
          min-height: 110px;
          object-fit: cover;
          display: block;
        }
        .preview-pdf-tile {
          min-height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 8px;
          font-size: 12px;
          color: #334155;
          background: #eef2ff;
        }

        .preview-actions {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #64748b;
        }

        @media (max-width: 1024px) {
          .create-post-layout {
            grid-template-columns: 1fr;
          }

          .live-preview-panel {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}
