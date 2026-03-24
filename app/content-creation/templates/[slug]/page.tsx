'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { getTemplateById, ContentTemplate, TemplateField } from '@/lib/content-templates';
import LeftSidebar from '@/component/LeftSidebar';
import PageHeader from '@/component/PageHeader';

marked.use({ gfm: true, breaks: true });

/** Unwrap content from various backend response shapes, including nested JSON. */
function extractContent(data: Record<string, unknown>): string {
  const result = data?.result;
  let reply: string =
    (result && typeof result === 'object' && typeof (result as Record<string, unknown>).response === 'string'
      ? (result as Record<string, unknown>).response as string : '') ||
    (typeof result === 'string' ? result : '') ||
    (typeof data?.output === 'string' ? data.output as string : '') ||
    (typeof data?.message === 'string' ? data.message as string : '') ||
    (typeof data?.response === 'string' ? data.response as string : '') ||
    (typeof data?.answer === 'string' ? data.answer as string : '') ||
    (typeof data?.responseContent === 'string' ? data.responseContent as string : '') ||
    (typeof data?.content === 'string' ? data.content as string : '');

  // Unwrap if the reply is itself a JSON string (double-encoded backend responses)
  if (reply && reply.trim().startsWith('{')) {
    try {
      const inner = JSON.parse(reply) as Record<string, unknown>;
      reply =
        (typeof inner.result === 'string' ? inner.result : '') ||
        (typeof inner.output === 'string' ? inner.output : '') ||
        (typeof inner.response === 'string' ? inner.response : '') ||
        (typeof inner.message === 'string' ? inner.message : '') ||
        (typeof inner.answer === 'string' ? inner.answer : '') ||
        reply;
    } catch { /* keep original */ }
  }

  // Fix escaped newlines that slip through JSON serialization
  return reply.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
}

function renderMarkdown(text: string): string {
  const html = marked.parse(text) as string;
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'em', 'b', 'i', 'u', 's', 'del',
      'ul', 'ol', 'li', 'p', 'br', 'hr',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'span', 'div',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href', 'target', 'rel'],
      '*': ['class'],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
    },
    disallowedTagsMode: 'discard',
  });
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function Field({
  field, value, onChange,
}: {
  field: TemplateField;
  value: string;
  onChange: (val: string) => void;
}) {
  const base: React.CSSProperties = {
    width: '100%', borderRadius: '8px', border: '1.5px solid #e5e7eb',
    padding: '10px 13px', fontSize: '13.5px', color: '#111827',
    outline: 'none', fontFamily: 'inherit', background: '#fff',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  };

  if (field.type === 'select') {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...base, cursor: 'pointer' }}>
        <option value="">— Select —</option>
        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (field.type === 'textarea') {
    return (
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 3}
          maxLength={field.maxLength}
          style={{ ...base, resize: 'vertical', lineHeight: 1.6 }}
          onFocus={e => (e.target.style.borderColor = '#6391ff')}
          onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
        />
        {field.maxLength && (
          <div style={{ position: 'absolute', bottom: '8px', right: '10px', fontSize: '11px', color: '#9ca3af' }}>
            {value.length}/{field.maxLength}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        style={base}
        onFocus={e => (e.target.style.borderColor = '#6391ff')}
        onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
      />
      {field.maxLength && (
        <div style={{ position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', fontSize: '11px', color: '#d1d5db' }}>
          {value.length}/{field.maxLength}
        </div>
      )}
    </div>
  );
}

function ToolBtn({ title, icon, onClick }: { title: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px',
        padding: '5px 9px', cursor: 'pointer', color: '#4b5563', fontSize: '13px',
        display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      {icon}
    </button>
  );
}

export default function TemplatePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const template: ContentTemplate | undefined = getTemplateById(slug);

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((template?.fields || []).map(f => [f.id, '']))
  );
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [variantCount, setVariantCount] = useState(1);
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const renderedHtml = useMemo(() => (output ? renderMarkdown(output) : ''), [output]);

  const setField = useCallback((id: string, val: string) => {
    setValues(prev => ({ ...prev, [id]: val }));
  }, []);

  const canGenerate = template?.fields
    .filter(f => f.required)
    .every(f => values[f.id]?.trim());

  const handleGenerate = async () => {
    if (!template || !canGenerate) return;
    setLoading(true);
    setError('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) throw new Error('Backend URL is not configured (NEXT_PUBLIC_BACKEND_URL).');

      const prompt = template.buildPrompt(values) +
        (variantCount > 1 ? `\n\nGenerate ${variantCount} distinct variations.` : '');

      const sessionId = `content_${template.id}_${Date.now()}`;
      const res = await fetch(`${backendUrl}/v1/api/n8n/anonymous/chat/generic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          message: prompt,
          sessionId,
          model: 'gpt-4o',
        }),
      });

      const rawText = await res.text();
      let data: Record<string, unknown>;
      try { data = rawText ? JSON.parse(rawText) : {}; } catch { data = { message: rawText }; }

      if (!res.ok || (data && data.success === false)) {
        throw new Error(
          (data && ((data.errorMessage as string) || (data.message as string))) ||
          `AI error: ${res.status}`
        );
      }

      const reply = extractContent(data);
      if (!reply?.trim()) throw new Error('AI did not return usable content. Please try again.');
      setOutput(reply.trim());
      setViewMode('preview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${template?.id || 'content'}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!template) {
    return (
      <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: '#f8f9fa' }}>
        <LeftSidebar />
        <main style={{ flex: 1, marginLeft: '280px', paddingTop: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>😕</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>Template not found</div>
            <button
              onClick={() => router.push('/content-creation/templates')}
              style={{ marginTop: '16px', padding: '10px 20px', background: '#6391ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              ← Back to Templates
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', background: '#f8f9fa', overflow: 'hidden' }}>
      {/* Left navigation */}
      <LeftSidebar />

      {/* Main content column */}
      <div style={{ flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        <PageHeader
          breadcrumb={['Content Creation', 'Pre-built Templates']}
          title={template.name}
          subtitle={template.description}
          icon={<span style={{ fontSize: '22px' }}>{template.emoji}</span>}
        />

        {/* Two-panel row */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* ── LEFT PANEL — Form ── */}
          <div style={{
            width: '380px', flexShrink: 0, overflowY: 'auto',
            borderRight: '1.5px solid #e5e7eb', background: '#fafafa',
            padding: '24px 20px', display: 'flex', flexDirection: 'column',
          }}>
            {/* Back nav */}
            <button
              onClick={() => router.push('/content-creation/templates')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', padding: 0, marginBottom: '20px', fontWeight: 500 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Templates
            </button>

            {/* Template header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px' }}>{template.emoji}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>{template.name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{template.description}</div>
              </div>
            </div>

            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Choose use case
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {template.fields.map(field => (
                <div key={field.id}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    {field.label}
                    {field.required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
                  </label>
                  <Field field={field} value={values[field.id] || ''} onChange={val => setField(field.id, val)} />
                </div>
              ))}
            </div>

            {/* Variants */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Number of Variants
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setVariantCount(n)}
                    style={{
                      flex: 1, padding: '7px', border: '1.5px solid', borderRadius: '8px', cursor: 'pointer',
                      fontFamily: 'inherit', fontWeight: 600, fontSize: '13px',
                      borderColor: variantCount === n ? '#6391ff' : '#e5e7eb',
                      background: variantCount === n ? '#6391ff15' : '#fff',
                      color: variantCount === n ? '#6391ff' : '#4b5563',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ marginTop: '14px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12.5px', color: '#dc2626' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              style={{
                marginTop: '24px', padding: '14px', width: '100%',
                background: canGenerate && !loading ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e5e7eb',
                color: canGenerate && !loading ? '#fff' : '#9ca3af',
                border: 'none', borderRadius: '10px',
                cursor: canGenerate && !loading ? 'pointer' : 'not-allowed',
                fontWeight: 800, fontSize: '15px', fontFamily: 'inherit',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: canGenerate && !loading ? '0 4px 14px rgba(99,102,241,0.4)' : 'none',
              }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Show the magic ✨
                </>
              )}
            </button>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>

          {/* ── RIGHT PANEL — Output ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>

            {/* Output toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', borderBottom: '1.5px solid #e5e7eb',
              background: '#fff', flexShrink: 0, gap: '10px', flexWrap: 'wrap',
            }}>
              {/* Left: label + stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{template.outputLabel}</span>
                {output && (
                  <span style={{ fontSize: '11.5px', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '12px' }}>
                    {wordCount(output)} words · {output.length} chars
                  </span>
                )}
              </div>

              {/* Right: preview/edit toggle + action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Preview / Edit pill toggle */}
                {output && (
                  <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                    {(['preview', 'edit'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        style={{
                          padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                          fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
                          background: viewMode === mode ? '#fff' : 'transparent',
                          color: viewMode === mode ? '#111827' : '#6b7280',
                          boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s',
                        }}
                      >
                        {mode === 'preview' ? '👁 Preview' : '✏️ Edit'}
                      </button>
                    ))}
                  </div>
                )}

                <ToolBtn title="Copy to clipboard" onClick={handleCopy} icon={copied ? (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg><span style={{ color: '#10b981', fontWeight: 600 }}>Copied!</span></>
                ) : (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg><span>Copy</span></>
                )} />
                <ToolBtn title="Download as .txt" onClick={handleDownload} icon={
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg><span>Download</span></>
                } />
                {output && (
                  <ToolBtn title="Clear output" onClick={() => setOutput('')} icon={
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg><span>Clear</span></>
                  } />
                )}
              </div>
            </div>

            {/* Output body */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

              {/* Empty state */}
              {!output && !loading && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px',
                }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '20px',
                    background: 'linear-gradient(135deg, #f0f0ff, #e8e0ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px',
                  }}>
                    {template.emoji}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '17px', color: '#374151', marginBottom: '6px' }}>
                      Ready to create {template.name}
                    </div>
                    <div style={{ fontSize: '13.5px', color: '#9ca3af', maxWidth: '340px', lineHeight: 1.6 }}>
                      Fill in the fields on the left and click <strong>Show the magic ✨</strong> to generate your content.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
                    {['AI-powered', 'Instant results', 'Fully editable'].map(tag => (
                      <span key={tag} style={{ fontSize: '12px', background: '#f3f4f6', color: '#6b7280', padding: '4px 12px', borderRadius: '20px', fontWeight: 500 }}>
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Shimmer skeleton while loading */}
              {loading && (
                <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[100, 90, 75, 95, 60, 80, 70, 85, 55, 92].map((w, i) => (
                    <div key={i} style={{
                      height: i % 4 === 0 ? '20px' : '13px',
                      borderRadius: '6px', width: `${w}%`,
                      background: 'linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.4s infinite',
                      marginTop: i % 4 === 0 ? '10px' : '0',
                    }} />
                  ))}
                  <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
                </div>
              )}

              {/* Preview mode — rendered markdown */}
              {output && !loading && viewMode === 'preview' && (
                <div
                  className="md-output"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  style={{
                    height: '100%', overflowY: 'auto',
                    padding: '28px 32px',
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: '14px', lineHeight: 1.8, color: '#1f2937',
                    boxSizing: 'border-box',
                  }}
                />
              )}

              {/* Edit mode — raw markdown textarea */}
              {output && !loading && viewMode === 'edit' && (
                <textarea
                  ref={outputRef}
                  value={output}
                  onChange={e => setOutput(e.target.value)}
                  style={{
                    width: '100%', height: '100%', border: 'none', outline: 'none',
                    resize: 'none', padding: '24px',
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: '13px', lineHeight: 1.7, color: '#374151',
                    background: '#fafafa', boxSizing: 'border-box',
                  }}
                />
              )}

              {/* Scoped markdown styles */}
              <style>{`
                .md-output h1 { font-size:1.5rem; font-weight:800; color:#111827; margin:1.4rem 0 0.6rem; border-bottom:2px solid #e5e7eb; padding-bottom:0.3rem; }
                .md-output h2 { font-size:1.2rem; font-weight:700; color:#1e293b; margin:1.2rem 0 0.5rem; }
                .md-output h3 { font-size:1.05rem; font-weight:700; color:#374151; margin:1rem 0 0.4rem; }
                .md-output h4,.md-output h5 { font-size:0.95rem; font-weight:600; color:#4b5563; margin:0.8rem 0 0.3rem; }
                .md-output p { margin:0 0 0.8rem; }
                .md-output ul,.md-output ol { padding-left:1.5rem; margin:0 0 0.8rem; }
                .md-output li { margin-bottom:0.3rem; }
                .md-output strong,.md-output b { font-weight:700; color:#111827; }
                .md-output em,.md-output i { font-style:italic; }
                .md-output code { background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:1px 6px; font-size:0.88em; font-family:monospace; color:#7c3aed; }
                .md-output pre { background:#1e293b; color:#e2e8f0; border-radius:8px; padding:16px 20px; overflow-x:auto; margin:0 0 1rem; }
                .md-output pre code { background:none; border:none; color:inherit; padding:0; font-size:0.9em; }
                .md-output blockquote { border-left:3px solid #6366f1; padding:8px 16px; margin:0 0 1rem; background:#f8f8ff; color:#4b5563; border-radius:0 6px 6px 0; }
                .md-output hr { border:none; border-top:1.5px solid #e5e7eb; margin:1.4rem 0; }
                .md-output table { width:100%; border-collapse:collapse; margin:0 0 1rem; font-size:13px; }
                .md-output th { background:#f3f4f6; font-weight:700; padding:8px 12px; border:1px solid #e5e7eb; text-align:left; }
                .md-output td { padding:7px 12px; border:1px solid #e5e7eb; }
                .md-output tr:nth-child(even) td { background:#f9fafb; }
                .md-output a { color:#6366f1; text-decoration:underline; }
              `}</style>
            </div>

          </div>
          {/* end right panel */}

        </div>
        {/* end two-panel row */}

      </div>
      {/* end main content column */}

    </div>
  );
}
