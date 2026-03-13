"use client";

import React from "react";

export default function AssetsPage() {
  return (
    <div className="assets-page">
      <h2 className="page-title">Assets</h2>
      <p className="page-desc">Upload and manage images, videos, and other media for your social posts.</p>
      <div className="assets-upload-zone">
        <div className="upload-placeholder">
          <span className="upload-icon">📁</span>
          <p>Drag and drop files here or click to upload</p>
          <span className="upload-hint">Images, videos, GIFs (max 50MB)</span>
        </div>
      </div>
      <div className="assets-grid">
        <p className="empty-state">No assets uploaded yet. Upload media to use in your posts.</p>
      </div>
      <style jsx>{`
        .assets-page {
          max-width: 800px;
        }
        .page-title {
          margin: 0 0 8px;
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
        }
        .page-desc {
          margin: 0 0 24px;
          color: #64748b;
          font-size: 14px;
        }
        .assets-upload-zone {
          border: 2px dashed rgba(148, 163, 184, 0.5);
          border-radius: 16px;
          padding: 48px 24px;
          text-align: center;
          margin-bottom: 24px;
          background: #f8fafc;
        }
        .upload-placeholder {
          color: #64748b;
        }
        .upload-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .upload-placeholder p {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 500;
          color: #475569;
        }
        .upload-hint {
          font-size: 13px;
          color: #94a3b8;
        }
        .assets-grid {
          min-height: 200px;
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 12px;
          padding: 24px;
          background: #f8fafc;
        }
        .empty-state {
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
