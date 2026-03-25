'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';
import PageHeader from '@/component/PageHeader';
import { CONTENT_TEMPLATES, TEMPLATE_CATEGORIES, ContentTemplate } from '@/lib/content-templates';

const CATEGORY_COLORS: Record<string, string> = {
  'Articles & Blogs':  '#6366f1',
  'Ads & Marketing':   '#f59e0b',
  'E-commerce':        '#10b981',
  'General Writing':   '#8b5cf6',
  'Jobs & Companies':  '#3b82f6',
  'Profile & Bio':     '#ec4899',
  'SEO & Web':         '#06b6d4',
};

function TemplateCard({ template, onClick }: { template: ContentTemplate; onClick: () => void }) {
  const color = CATEGORY_COLORS[template.category] || '#6391ff';
  return (
    <button
      onClick={onClick}
      style={{
        background: '#ffffff',
        border: '1.5px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.18s',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.1)`;
        (e.currentTarget as HTMLButtonElement).style.borderColor = color;
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
        (e.currentTarget as HTMLButtonElement).style.transform = 'none';
      }}
    >
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color, borderRadius: '12px 12px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Icon */}
        <div style={{
          width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
        }}>
          {template.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827', lineHeight: 1.3, marginBottom: '4px' }}>
            {template.name}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
            {template.description}
          </div>
        </div>
      </div>

      {/* Category pill */}
      <div style={{
        alignSelf: 'flex-start', fontSize: '11px', fontWeight: 600,
        padding: '3px 8px', borderRadius: '20px',
        background: `${color}15`, color: color,
        letterSpacing: '0.02em',
      }}>
        {template.category}
      </div>
    </button>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Read category from URL query param on mount and when it changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setActiveCategory(decodeURIComponent(categoryFromUrl));
    } else {
      setActiveCategory('All');
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = activeCategory === 'All' ? CONTENT_TEMPLATES : CONTENT_TEMPLATES.filter(t => t.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, search]);

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: '#f8f9fa' }}>
      <LeftSidebar />
      <main style={{ flex: 1, marginLeft: '280px', paddingTop: '60px', background: '#f8f9fa', minHeight: '100vh' }}>
      <PageHeader
        breadcrumb={['Content Creation']}
        title="Pre-built Templates"
        subtitle="Choose a template to generate content instantly with AI."
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        }
      />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 60px' }}>

        {/* Header */}
        <div style={{ margin: '50px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '6px' }}>
            TEMPLATE CATEGORY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0 }}>
              Pre-built Templates to get you started fast.
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '8px 14px', minWidth: '240px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search templates…"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#111827', width: '100%' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, lineHeight: 1 }}>✕</button>
              )}
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '28px', borderBottom: '1.5px solid #f3f4f6', paddingBottom: '14px' }}>
          {TEMPLATE_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            const color = CATEGORY_COLORS[cat] || '#6391ff';
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSearch('');
                  // Update URL to match the category
                  if (cat === 'All') {
                    router.push('/content-creation/templates');
                  } else {
                    router.push(`/content-creation/templates?category=${encodeURIComponent(cat)}`);
                  }
                }}
                style={{
                  padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: isActive ? 700 : 500, fontFamily: 'inherit',
                  background: isActive ? (cat === 'All' ? '#111827' : color) : '#f3f4f6',
                  color: isActive ? '#ffffff' : '#4b5563',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? `0 2px 8px ${cat === 'All' ? 'rgba(0,0,0,0.2)' : color + '55'}` : 'none',
                }}
              >
                {cat}
                <span style={{ marginLeft: '5px', opacity: 0.7, fontSize: '11px' }}>
                  {cat === 'All' ? CONTENT_TEMPLATES.length : CONTENT_TEMPLATES.filter(t => t.category === cat).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results count */}
        {search && (
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>No templates found</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>Try a different search term or category</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {filtered.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onClick={() => router.push(`/content-creation/templates/${t.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
