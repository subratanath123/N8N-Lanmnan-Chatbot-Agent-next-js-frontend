'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';
import PageHeader from '@/component/PageHeader';
import { MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import { useAuth } from '@clerk/nextjs';

interface GenerationJob {
    id: string;
    prompt: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    imageUrl?: string;
    error?: string;
    createdAt: string;
    assetId?: string;
}

export default function AIImagesPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [jobs, setJobs] = useState<GenerationJob[]>([]);
    const [size, setSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024');
    const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
    const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

    const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
        if (collapsed !== undefined) {
            setSidebarCollapsed(collapsed);
        }
    };

    const handleNavItemClick = (itemName: string, itemHref: string) => {
        if (itemName === 'AI Images') return;
        if (itemHref && itemHref !== '#') {
            router.push(itemHref);
        }
    };

    // Load jobs from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('ai_image_jobs');
        if (stored) {
            try {
                const loadedJobs = JSON.parse(stored);
                setJobs(loadedJobs);
            } catch (err) {
                console.error('Failed to load jobs from localStorage:', err);
            }
        }
    }, []);

    // Save jobs to localStorage whenever they change
    useEffect(() => {
        if (jobs.length > 0) {
            localStorage.setItem('ai_image_jobs', JSON.stringify(jobs));
        }
    }, [jobs]);

    // Poll for job status updates
    useEffect(() => {
        const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');
        if (pendingJobs.length === 0) return;

        const pollInterval = setInterval(async () => {
            for (const job of pendingJobs) {
                await checkJobStatus(job.id);
            }
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [jobs]);

    const checkJobStatus = async (jobId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${backendUrl}/v1/api/ai-images/status/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setJobs(prev => prev.map(j => 
                    j.id === jobId ? { ...j, ...data } : j
                ));
            }
        } catch (err) {
            console.error('Failed to check job status:', err);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            alert('Please enter a prompt');
            return;
        }

        if (!backendUrl) {
            alert('Backend URL not configured');
            return;
        }

        try {
            setGenerating(true);
            const token = await getToken();

            const res = await fetch(`${backendUrl}/v1/api/ai-images/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    size,
                    quality,
                    style
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Generation failed');
            }

            const data = await res.json();
            
            const newJob: GenerationJob = {
                id: data.jobId,
                prompt: prompt.trim(),
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            setJobs(prev => [newJob, ...prev]);
            setPrompt('');

        } catch (err) {
            console.error('Generation error:', err);
            alert(err instanceof Error ? err.message : 'Failed to generate image');
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = (imageUrl: string, prompt: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `ai-image-${prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.png`;
        link.target = '_blank';
        link.click();
    };

    return (
        <div className="full-height-layout">
            <LeftSidebar 
                onDrawerStateChange={handleDrawerStateChange}
                onNavItemClick={handleNavItemClick}
            />

            <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <PageHeader
                    breadcrumb={['AI Social Media']}
                    title="AI Images"
                    subtitle="Generate stunning images with AI using DALL-E 3"
                    icon={
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                            <circle cx="12" cy="12" r="2"/>
                            <path d="M12 2v4"/>
                        </svg>
                    }
                />

                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Generation Form Card */}
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '28px',
                        marginBottom: '28px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ 
                                fontSize: '15px', 
                                fontWeight: 700, 
                                color: '#0f172a',
                                marginBottom: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <MDBIcon fas icon="magic" style={{ color: '#7c3aed' }} />
                                Generate New Image
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Describe your image and let AI create it for you
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                fontSize: '12px', 
                                fontWeight: 600, 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                color: '#64748b', 
                                marginBottom: '8px', 
                                display: 'block' 
                            }}>
                                Image Prompt *
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to generate (e.g., 'A serene mountain landscape at sunset with aurora borealis')"
                                disabled={generating}
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    lineHeight: '1.5',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                            gap: '16px', 
                            marginBottom: '24px' 
                        }}>
                            <div>
                                <label style={{ 
                                    fontSize: '12px', 
                                    fontWeight: 600, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.05em',
                                    color: '#64748b', 
                                    marginBottom: '8px', 
                                    display: 'block' 
                                }}>
                                    Size
                                </label>
                                <select
                                    value={size}
                                    onChange={(e) => setSize(e.target.value as any)}
                                    disabled={generating}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: '#fff',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                >
                                    <option value="1024x1024">Square (1024×1024)</option>
                                    <option value="1792x1024">Landscape (1792×1024)</option>
                                    <option value="1024x1792">Portrait (1024×1792)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ 
                                    fontSize: '12px', 
                                    fontWeight: 600, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.05em',
                                    color: '#64748b', 
                                    marginBottom: '8px', 
                                    display: 'block' 
                                }}>
                                    Quality
                                </label>
                                <select
                                    value={quality}
                                    onChange={(e) => setQuality(e.target.value as any)}
                                    disabled={generating}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: '#fff',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                >
                                    <option value="standard">Standard</option>
                                    <option value="hd">HD (Higher Quality)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ 
                                    fontSize: '12px', 
                                    fontWeight: 600, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.05em',
                                    color: '#64748b', 
                                    marginBottom: '8px', 
                                    display: 'block' 
                                }}>
                                    Style
                                </label>
                                <select
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value as any)}
                                    disabled={generating}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: '#fff',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                >
                                    <option value="vivid">Vivid (Dramatic)</option>
                                    <option value="natural">Natural (Realistic)</option>
                                </select>
                            </div>
                        </div>

                        <MDBBtn
                            color="primary"
                            onClick={handleGenerate}
                            disabled={generating || !prompt.trim()}
                            style={{ 
                                borderRadius: '8px',
                                padding: '12px 32px',
                                fontSize: '14px',
                                fontWeight: 600,
                                boxShadow: generating ? 'none' : '0 2px 8px rgba(124, 58, 237, 0.25)'
                            }}
                        >
                            {generating ? (
                                <>
                                    <MDBIcon fas icon="spinner" spin className="me-2" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <MDBIcon fas icon="wand-magic-sparkles" className="me-2" />
                                    Generate Image
                                </>
                            )}
                        </MDBBtn>
                    </div>

                    {/* Generation History Section */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ 
                            fontSize: '12px', 
                            fontWeight: 700, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.08em', 
                            color: '#9ca3af'
                        }}>
                            GENERATION HISTORY
                        </div>
                    </div>

                    {jobs.length === 0 ? (
                        <div style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '60px 40px',
                            border: '1px solid #e2e8f0',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                opacity: 0.9
                            }}>
                                <MDBIcon fas icon="palette" style={{ fontSize: '36px', color: '#fff' }} />
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                                No images generated yet
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
                                Enter a creative prompt above and let DALL-E 3 bring your ideas to life
                            </div>
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                            gap: '24px' 
                        }}>
                            {jobs.map((job) => (
                                <div 
                                    key={job.id} 
                                    style={{ 
                                        background: '#fff',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '1px solid #e2e8f0',
                                        transition: 'all 0.3s ease',
                                        cursor: job.status === 'completed' ? 'pointer' : 'default'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (job.status === 'completed') {
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.1)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Image Preview */}
                                    {job.status === 'completed' && job.imageUrl ? (
                                        <div style={{ position: 'relative', paddingTop: '75%', background: '#f1f5f9' }}>
                                            <img
                                                src={job.imageUrl}
                                                alt={job.prompt}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                                onClick={() => window.open(job.imageUrl, '_blank')}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: '12px',
                                                right: '12px',
                                                display: 'flex',
                                                gap: '8px'
                                            }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(job.imageUrl!, job.prompt);
                                                    }}
                                                    style={{
                                                        background: 'rgba(0, 0, 0, 0.7)',
                                                        backdropFilter: 'blur(8px)',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        width: '36px',
                                                        height: '36px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.85)';
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    <MDBIcon fas icon="download" style={{ fontSize: '14px' }} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : job.status === 'processing' || job.status === 'pending' ? (
                                        <div style={{
                                            paddingTop: '75%',
                                            position: 'relative',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                textAlign: 'center',
                                                color: '#fff'
                                            }}>
                                                <MDBIcon fas icon="spinner" spin style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.9 }} />
                                                <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>
                                                    {job.status === 'pending' ? 'QUEUED' : 'GENERATING'}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{
                                            paddingTop: '75%',
                                            position: 'relative',
                                            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                textAlign: 'center',
                                                color: '#991b1b',
                                                padding: '20px'
                                            }}>
                                                <MDBIcon fas icon="exclamation-triangle" style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.8 }} />
                                                <div style={{ fontSize: '13px', fontWeight: 600 }}>Failed</div>
                                                {job.error && (
                                                    <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.7, maxWidth: '200px' }}>
                                                        {job.error.substring(0, 100)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Card Content */}
                                    <div style={{ padding: '16px' }}>
                                        {/* Status Badge & Time */}
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center', 
                                            marginBottom: '12px' 
                                        }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '5px 12px',
                                                background: job.status === 'completed' ? '#dcfce7' : 
                                                           job.status === 'failed' ? '#fee2e2' : '#fef3c7',
                                                color: job.status === 'completed' ? '#166534' : 
                                                       job.status === 'failed' ? '#991b1b' : '#92400e',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>
                                                {job.status === 'processing' && <MDBIcon fas icon="spinner" spin style={{ fontSize: '10px' }} />}
                                                {job.status === 'pending' && <MDBIcon fas icon="clock" style={{ fontSize: '10px' }} />}
                                                {job.status === 'completed' && <MDBIcon fas icon="check-circle" style={{ fontSize: '10px' }} />}
                                                {job.status === 'failed' && <MDBIcon fas icon="times-circle" style={{ fontSize: '10px' }} />}
                                                {job.status}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                                                {new Date(job.createdAt).toLocaleString('en-US', { 
                                                    hour: 'numeric', 
                                                    minute: '2-digit',
                                                    hour12: true 
                                                })}
                                            </span>
                                        </div>

                                        {/* Prompt */}
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#475569',
                                            lineHeight: '1.6',
                                            marginBottom: job.status === 'completed' ? '14px' : '0',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {job.prompt}
                                        </div>

                                        {/* Actions */}
                                        {job.status === 'completed' && (
                                            <div style={{ 
                                                display: 'flex', 
                                                gap: '10px',
                                                paddingTop: '14px',
                                                borderTop: '1px solid #f1f5f9'
                                            }}>
                                                <MDBBtn
                                                    outline
                                                    color="dark"
                                                    size="sm"
                                                    onClick={() => window.open(job.imageUrl, '_blank')}
                                                    style={{ 
                                                        borderRadius: '6px', 
                                                        flex: 1,
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        padding: '8px'
                                                    }}
                                                >
                                                    <MDBIcon fas icon="expand" className="me-1" style={{ fontSize: '11px' }} />
                                                    View
                                                </MDBBtn>
                                                <MDBBtn
                                                    color="primary"
                                                    size="sm"
                                                    onClick={() => handleDownload(job.imageUrl!, job.prompt)}
                                                    style={{ 
                                                        borderRadius: '6px', 
                                                        flex: 1,
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        padding: '8px'
                                                    }}
                                                >
                                                    <MDBIcon fas icon="download" className="me-1" style={{ fontSize: '11px' }} />
                                                    Save
                                                </MDBBtn>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .full-height-layout {
                    display: flex;
                    width: 100%;
                    min-height: 100vh;
                    position: relative;
                    background-color: #f8f9fa;
                }

                .main-content {
                    flex: 1;
                    margin-left: 280px;
                    padding: 0;
                    min-height: 100vh;
                    background-color: #f8f9fa;
                    transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow-x: hidden;
                    position: relative;
                    z-index: 1;
                }

                .main-content.collapsed {
                    margin-left: 60px;
                }

                @media (max-width: 768px) {
                    .main-content {
                        margin-left: 0 !important;
                        padding: 1rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
