"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import PageHeader from "@/component/PageHeader";

const ACCEPTED = "image/*,video/*";
const PER_PAGE = 20;

interface Asset {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  supabaseUrl: string;
  objectPath?: string;
  createdAt: string;
  tags?: string[];
}

const fmt = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const isImg = (mt: string) => mt?.startsWith("image/");
const isVid = (mt: string) => mt?.startsWith("video/");

interface UploadEntry {
  id: string;
  file: File;
  status: "uploading" | "done" | "error";
  errorMsg?: string;
  publicUrl?: string;
}

export default function AssetsPage() {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets]         = useState<Asset[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [uploads, setUploads]       = useState<UploadEntry[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedId, setCopiedId]     = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter]         = useState<"all" | "image" | "video">("all");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);

  /* ── helpers ── */
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const getHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken?.();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [getToken]);

  /* ── fetch list ── */
  const fetchAssets = useCallback(async () => {
    if (!backendUrl) { setLoadError("NEXT_PUBLIC_BACKEND_URL is not configured."); setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${backendUrl}/v1/api/assets`, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Backend returned ${res.status}`);
      }
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : (data.assets ?? []));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load assets.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl, getHeaders]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  /* ── upload ── */
  const uploadFiles = async (files: FileList | File[]) => {
    // Convert immediately — FileList is a live reference and gets cleared after input reset
    const incoming = Array.from(files);
    if (!incoming.length) return;

    if (!backendUrl) { alert("Backend URL not configured (NEXT_PUBLIC_BACKEND_URL missing)."); return; }

    const headers = await getHeaders();
    if (!headers.Authorization) { alert("Not signed in — cannot upload."); return; }

    const entries: UploadEntry[] = incoming.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      status: "uploading",
    }));
    setUploads((prev) => [...prev, ...entries]);

    const formData = new FormData();
    incoming.forEach((f) => formData.append("files", f, f.name));


    try {
      const res = await fetch(`${backendUrl}/v1/api/assets/upload`, {
        method: "POST",
        headers,       // no Content-Type — browser sets multipart boundary automatically
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || `Upload failed (${res.status})`;
        setUploads((prev) =>
          prev.map((u) => entries.some((e) => e.id === u.id) ? { ...u, status: "error", errorMsg: msg } : u)
        );
        return;
      }

      // Mark each file done or error based on partial results
      const uploaded: Asset[]                   = data.uploaded ?? [];
      const failed:   { fileName: string; error: string }[] = data.failed   ?? [];

      setUploads((prev) =>
        prev.map((u) => {
          if (!entries.some((e) => e.id === u.id)) return u;
          const ok  = uploaded.find((a) => a.fileName === u.file.name);
          const err = failed.find((f) => f.fileName === u.file.name);
          if (ok)  return { ...u, status: "done",  publicUrl: ok.supabaseUrl };
          if (err) return { ...u, status: "error", errorMsg: err.error };
          return { ...u, status: "done" };
        })
      );

      await fetchAssets();
      setTimeout(() => setUploads((prev) => prev.filter((u) => u.status !== "done")), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setUploads((prev) =>
        prev.map((u) => entries.some((e) => e.id === u.id) ? { ...u, status: "error", errorMsg: msg } : u)
      );
    }
  };

  /* ── delete ── */
  const deleteAsset = async (asset: Asset) => {
    if (!backendUrl) return;
    if (!confirm(`Delete "${asset.fileName}"?`)) return;
    setDeletingId(asset.id);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${backendUrl}/v1/api/assets/${asset.id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── copy URL ── */
  const copyUrl = (asset: Asset) => {
    navigator.clipboard.writeText(asset.supabaseUrl).then(() => {
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  /* ── filtered list ── */
  const filtered = assets.filter((a) => {
    if (filter === "image" && !isImg(a.mimeType)) return false;
    if (filter === "video" && !isVid(a.mimeType)) return false;
    if (search && !a.fileName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="ap">

      <PageHeader
        breadcrumb={["Home", "AI Social Media Suite", "Assets"]}
        title="Media Assets"
        subtitle="Upload images and videos. Your backend stores them in Supabase and tracks them per account."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        }
        actions={
          <button className="ap-upload-btn" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon /> Upload Files
          </button>
        }
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />

      {/* Drop zone */}
      <div
        className={`ap-dz ${isDragOver ? "active" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files); }}
      >
        <ImgIcon />
        <span className="ap-dz-title">{isDragOver ? "Drop to upload" : "Drag & drop images or videos"}</span>
        <span className="ap-dz-hint">or click / use the button above · sent to backend for storage</span>
      </div>

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="ap-queue">
          <div className="ap-queue-label">Uploads</div>
          {uploads.map((u) => (
            <div key={u.id} className={`ap-qrow ap-qrow--${u.status}`}>
              <div className="ap-qthumb">
                {u.file.type.startsWith("image/")
                  ? <img src={URL.createObjectURL(u.file)} alt="" className="ap-qt-img" />
                  : <span>🎬</span>}
              </div>
              <div className="ap-qinfo">
                <span className="ap-qname">{u.file.name}</span>
                <span className="ap-qsize">{fmt(u.file.size)}</span>
              </div>
              <div className="ap-qstatus">
                {u.status === "uploading" && <><Spinner />Uploading…</>}
                {u.status === "done"      && <span className="s-ok">✓ Uploaded</span>}
                {u.status === "error"     && <span className="s-err" title={u.errorMsg}>✕ {u.errorMsg}</span>}
              </div>
              {u.status !== "uploading" && (
                <button className="ap-dismiss" onClick={() => setUploads((p) => p.filter((x) => x.id !== u.id))}>×</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="ap-stats">
        {[
          { n: assets.length, l: "Total files" },
          { n: assets.filter((a) => isImg(a.mimeType)).length, l: "Images" },
          { n: assets.filter((a) => isVid(a.mimeType)).length, l: "Videos" },
          { n: fmt(assets.reduce((s, a) => s + (a.sizeBytes ?? 0), 0)), l: "Total size" },
        ].map((s) => (
          <div key={s.l} className="ap-stat">
            <span className="ap-stat-n">{s.n}</span>
            <span className="ap-stat-l">{s.l}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="ap-toolbar">
        <div className="ap-filters">
          {(["all", "image", "video"] as const).map((f) => (
            <button key={f} className={`ap-ftab ${filter === f ? "active" : ""}`}
              onClick={() => { setFilter(f); setPage(1); }}>
              {f === "all" ? "All" : f === "image" ? "Images" : "Videos"}
            </button>
          ))}
        </div>
        <input className="ap-search" placeholder="Search filename…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <button className="ap-refresh" onClick={fetchAssets} title="Refresh"><RefreshIcon /></button>
      </div>

      {/* Load error */}
      {loadError && (
        <div className="ap-err-banner">
          <strong>Could not load assets:</strong> {loadError}
          <br /><small>Make sure the backend implements <code>GET /v1/api/assets</code> — see <code>ASSETS_BACKEND_API.md</code>.</small>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="ap-grid">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="ap-skel" />)}
        </div>
      ) : paged.length === 0 ? (
        <div className="ap-empty">
          <span style={{ fontSize: 42 }}>🖼️</span>
          <p>{search || filter !== "all" ? "No assets match your filter." : "No assets yet — upload some files above."}</p>
        </div>
      ) : (
        <>
          <div className="ap-grid">
            {paged.map((asset) => (
              <div key={asset.id} className="ap-card">
                <div className="ap-thumb">
                  {isImg(asset.mimeType)
                    ? <img src={asset.supabaseUrl} alt={asset.fileName} loading="lazy" className="ap-thumb-img" />
                    : isVid(asset.mimeType)
                    ? <video src={asset.supabaseUrl} className="ap-thumb-img" muted playsInline />
                    : <div className="ap-thumb-fallback">📄</div>}

                  <div className="ap-badge">{isImg(asset.mimeType) ? "IMG" : isVid(asset.mimeType) ? "VID" : "FILE"}</div>

                  <div className="ap-overlay">
                    <button className="ap-ov-btn ap-ov-copy" onClick={() => copyUrl(asset)}>
                      {copiedId === asset.id ? "✓ Copied!" : "📋 Copy URL"}
                    </button>
                    <a href={asset.supabaseUrl} target="_blank" rel="noopener noreferrer"
                      className="ap-ov-btn ap-ov-open" onClick={(e) => e.stopPropagation()}>
                      ↗ Open
                    </a>
                    <button className="ap-ov-btn ap-ov-del" disabled={deletingId === asset.id}
                      onClick={() => deleteAsset(asset)}>
                      {deletingId === asset.id ? <Spinner sm /> : "🗑 Delete"}
                    </button>
                  </div>
                </div>
                <div className="ap-meta">
                  <span className="ap-name" title={asset.fileName}>
                    {asset.fileName.length > 26 ? asset.fileName.slice(0, 24) + "…" : asset.fileName}
                  </span>
                  <span className="ap-size">{fmt(asset.sizeBytes ?? 0)}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="ap-pages">
              <button className="ap-pg" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
              <span className="ap-pg-info">Page {page} of {totalPages}</span>
              <button className="ap-pg" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .ap { max-width: 1100px; padding-bottom: 60px; }

        .ap-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:24px; }
        .ap-title  { margin:0 0 6px; font-size:22px; font-weight:800; color:#0f172a; }
        .ap-desc   { margin:0; color:#64748b; font-size:14px; max-width:520px; line-height:1.6; }

        .ap-upload-btn {
          display:inline-flex; align-items:center; gap:8px; padding:10px 20px;
          background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; border:none;
          border-radius:10px; font-size:14px; font-weight:600; cursor:pointer;
          white-space:nowrap; box-shadow:0 4px 12px rgba(37,99,235,.3);
          flex-shrink:0; transition:opacity .15s;
        }
        .ap-upload-btn:hover { opacity:.88; }

        .ap-dz {
          border:2px dashed rgba(148,163,184,.5); border-radius:16px; padding:36px 24px;
          text-align:center; background:#f8fafc; cursor:pointer;
          transition:border-color .2s,background .2s; margin-bottom:20px;
          display:flex; flex-direction:column; align-items:center; gap:8px;
        }
        .ap-dz:hover, .ap-dz.active { border-color:#2563eb; background:rgba(37,99,235,.05); }
        .ap-dz-title { font-size:15px; font-weight:600; color:#475569; margin:4px 0 0; }
        .ap-dz.active .ap-dz-title { color:#2563eb; }
        .ap-dz-hint  { font-size:13px; color:#94a3b8; }

        .ap-queue { background:#fff; border:1px solid rgba(226,232,240,.9); border-radius:12px; padding:14px 16px; margin-bottom:20px; }
        .ap-queue-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#94a3b8; margin-bottom:10px; }
        .ap-qrow { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:8px; background:#f8fafc; margin-bottom:6px; border:1px solid transparent; }
        .ap-qrow--done  { background:rgba(34,197,94,.06); border-color:rgba(34,197,94,.2); }
        .ap-qrow--error { background:#fef2f2; border-color:rgba(239,68,68,.25); }
        .ap-qthumb { width:44px; height:44px; border-radius:7px; overflow:hidden; border:1px solid #e2e8f0; background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
        .ap-qt-img { width:100%; height:100%; object-fit:cover; }
        .ap-qinfo  { flex:1; display:flex; flex-direction:column; gap:2px; min-width:0; }
        .ap-qname  { font-size:13px; font-weight:500; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ap-qsize  { font-size:11px; color:#94a3b8; }
        .ap-qstatus { display:flex; align-items:center; gap:6px; font-size:12px; color:#64748b; max-width:300px; }
        .s-ok  { color:#16a34a; font-weight:600; }
        .s-err { color:#dc2626; font-weight:600; line-height:1.4; }
        .ap-dismiss { background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer; padding:0 4px; }
        .ap-dismiss:hover { color:#475569; }

        .ap-stats { display:flex; gap:16px; margin-bottom:20px; flex-wrap:wrap; }
        .ap-stat  { flex:1; min-width:100px; background:#fff; border:1px solid rgba(226,232,240,.9); border-radius:12px; padding:14px 18px; display:flex; flex-direction:column; gap:2px; }
        .ap-stat-n { font-size:20px; font-weight:800; color:#0f172a; }
        .ap-stat-l { font-size:12px; color:#64748b; }

        .ap-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
        .ap-filters { display:flex; gap:6px; }
        .ap-ftab { padding:7px 16px; border:1px solid rgba(226,232,240,.9); border-radius:999px; background:#fff; font-size:13px; font-weight:500; color:#475569; cursor:pointer; transition:all .15s; }
        .ap-ftab:hover { background:#f1f5f9; }
        .ap-ftab.active { background:#2563eb; border-color:#1d4ed8; color:#fff; }
        .ap-search { flex:1; min-width:160px; max-width:280px; padding:8px 14px; border:1px solid rgba(226,232,240,.9); border-radius:9px; font-size:13px; color:#0f172a; background:#f8fafc; }
        .ap-search:focus { outline:none; border-color:#2563eb; background:#fff; }
        .ap-refresh { padding:8px 10px; border:1px solid rgba(226,232,240,.9); border-radius:8px; background:#fff; color:#64748b; cursor:pointer; display:flex; align-items:center; margin-left:auto; }
        .ap-refresh:hover { background:#f1f5f9; }

        .ap-err-banner { padding:14px 18px; border-radius:10px; background:#fef2f2; color:#b91c1c; font-size:14px; border:1px solid #fecaca; margin-bottom:16px; line-height:1.6; }
        .ap-err-banner code { background:rgba(0,0,0,.07); padding:1px 5px; border-radius:4px; font-family:monospace; font-size:12px; }

        .ap-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:16px; }
        .ap-skel { height:220px; border-radius:12px; background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.2s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }

        .ap-empty { text-align:center; padding:60px 24px; color:#94a3b8; font-size:14px; border:1px solid rgba(226,232,240,.6); border-radius:12px; background:#f8fafc; display:flex; flex-direction:column; align-items:center; gap:10px; }
        .ap-empty p { margin:0; }

        .ap-card { border:1px solid rgba(226,232,240,.9); border-radius:12px; overflow:hidden; background:#fff; transition:box-shadow .2s; }
        .ap-card:hover { box-shadow:0 8px 24px rgba(15,23,42,.1); }

        .ap-thumb { position:relative; width:100%; aspect-ratio:1/1; overflow:hidden; background:#f8fafc; }
        .ap-thumb-img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .2s; }
        .ap-card:hover .ap-thumb-img { transform:scale(1.04); }
        .ap-thumb-fallback { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:32px; }

        .ap-badge { position:absolute; top:8px; left:8px; background:rgba(15,23,42,.55); color:#fff; font-size:9px; font-weight:800; letter-spacing:.08em; padding:2px 7px; border-radius:6px; }

        .ap-overlay { position:absolute; inset:0; background:rgba(15,23,42,.55); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:7px; opacity:0; transition:opacity .2s; }
        .ap-card:hover .ap-overlay { opacity:1; }
        .ap-ov-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 14px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; border:none; text-decoration:none; transition:opacity .15s; min-width:110px; justify-content:center; }
        .ap-ov-btn:hover { opacity:.85; }
        .ap-ov-copy { background:#fff; color:#0f172a; }
        .ap-ov-open { background:#2563eb; color:#fff; }
        .ap-ov-del  { background:#dc2626; color:#fff; }
        .ap-ov-btn:disabled { opacity:.6; cursor:not-allowed; }

        .ap-meta { padding:10px 12px; display:flex; align-items:center; justify-content:space-between; gap:6px; }
        .ap-name { font-size:12px; font-weight:500; color:#334155; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }
        .ap-size { font-size:11px; color:#94a3b8; white-space:nowrap; }

        .ap-pages { display:flex; align-items:center; justify-content:center; gap:12px; margin-top:24px; }
        .ap-pg { padding:8px 18px; border:1px solid rgba(226,232,240,.9); border-radius:8px; background:#fff; font-size:13px; font-weight:600; color:#475569; cursor:pointer; }
        .ap-pg:disabled { opacity:.4; cursor:default; }
        .ap-pg-info { font-size:13px; color:#64748b; }

        .sp { display:inline-block; width:16px; height:16px; border:2px solid #e2e8f0; border-top-color:#2563eb; border-radius:50%; animation:spin .7s linear infinite; flex-shrink:0; }
        .sp-sm { width:12px; height:12px; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}
function ImgIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}
function Spinner({ sm }: { sm?: boolean }) {
  return <span className={`sp${sm ? " sp-sm" : ""}`} />;
}
