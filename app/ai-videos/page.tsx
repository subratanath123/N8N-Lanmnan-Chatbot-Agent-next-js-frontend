'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';
import PageHeader from '@/component/PageHeader';
import { MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import { useAuth } from '@clerk/nextjs';

interface VideoJob {
    id: string;
    prompt: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    videoUrl?: string;
    thumbnailUrl?: string;
    error?: string;
    createdAt: string;
    assetId?: string;
    duration?: number;
}

export default function AIVideosPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [jobs, setJobs] = useState<VideoJob[]>([]);
    const [duration, setDuration] = useState<'5' | '10'>('5');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

    const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
        if (collapsed !== undefined) {
            setSidebarCollapsed(collapsed);
        }
    };

    const handleNavItemClick = (itemName: string, itemHref: string) => {
        if (itemName === 'AI Videos') return;
        if (itemHref && itemHref !== '#') {
            router.push(itemHref);
        }
    };

    // Load jobs from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('ai_video_jobs');
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
            localStorage.setItem('ai_video_jobs', JSON.stringify(jobs));
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
        }, 5000); // Poll every 5 seconds (videos take longer)

        return () => clearInterval(pollInterval);
    }, [jobs]);

    const checkJobStatus = async (jobId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${backendUrl}/v1/api/ai-videos/status/${jobId}`, {
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

            const res = await fetch(`${backendUrl}/v1/api/ai-videos/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    duration: parseInt(duration),
                    aspectRatio
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Generation failed');
            }

            const data = await res.json();
            
            const newJob: VideoJob = {
                id: data.jobId,
                prompt: prompt.trim(),
                status: 'pending',
                createdAt: new Date().toISOString(),
                duration: parseInt(duration)
            };

            setJobs(prev => [newJob, ...prev]);
            setPrompt('');

        } catch (err) {
            console.error('Generation error:', err);
            alert(err instanceof Error ? err.message : 'Failed to generate video');
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = (videoUrl: string, prompt: string) => {
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `ai-video-${prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.mp4`;
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
                    title="AI Videos"
                    subtitle="Generate professional videos with AI"
                    icon={
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
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
                                <MDBIcon fas icon="film" style={{ color: '#7c3aed' }} />
                                Generate New Video
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Describe your video concept and let AI create it for you
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
                                Video Prompt *
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the video you want to generate (e.g., 'A time-lapse of a city skyline from day to night with clouds moving')"
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
                            <div style={{ 
                                fontSize: '12px', 
                                color: '#94a3b8', 
                                marginTop: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <MDBIcon fas icon="info-circle" style={{ fontSize: '11px' }} />
                                Video generation may take 2-5 minutes depending on complexity
                            </div>
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
                                    Duration
                                </label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value as any)}
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
                                    <option value="5">5 seconds</option>
                                    <option value="10">10 seconds</option>
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
                                    Aspect Ratio
                                </label>
                                <select
                                    value={aspectRatio}
                                    onChange={(e) => setAspectRatio(e.target.value as any)}
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
                                    <option value="16:9">Landscape (16:9)</option>
                                    <option value="9:16">Portrait (9:16)</option>
                                    <option value="1:1">Square (1:1)</option>
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
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <MDBIcon fas icon="play-circle" className="me-2" />
                                    Generate Video
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
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                opacity: 0.9
                            }}>
                                <MDBIcon fas icon="video" style={{ fontSize: '36px', color: '#fff' }} />
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                                No videos generated yet
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
                                Enter a creative prompt above and let AI generate professional videos
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
                                    {/* Video Preview */}
                                    {job.status === 'completed' && job.videoUrl ? (
                                        <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                                            <video
                                                src={job.videoUrl}
                                                controls
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'contain'
                                                }}
                                            />
                                        </div>
                                    ) : job.status === 'processing' || job.status === 'pending' ? (
                                        <div style={{
                                            paddingTop: '56.25%',
                                            position: 'relative',
                                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
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
                                                <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.8 }}>
                                                    This may take 2-5 minutes
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{
                                            paddingTop: '56.25%',
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

                                        {/* Duration Badge */}
                                        {job.duration && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '4px 10px',
                                                    background: '#f1f5f9',
                                                    color: '#475569',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    fontWeight: 600
                                                }}>
                                                    <MDBIcon fas icon="clock" style={{ fontSize: '10px' }} />
                                                    {job.duration}s
                                                </span>
                                            </div>
                                        )}

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
                                                    onClick={() => window.open(job.videoUrl, '_blank')}
                                                    style={{ 
                                                        borderRadius: '6px', 
                                                        flex: 1,
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        padding: '8px'
                                                    }}
                                                >
                                                    <MDBIcon fas icon="external-link-alt" className="me-1" style={{ fontSize: '11px' }} />
                                                    Open
                                                </MDBBtn>
                                                <MDBBtn
                                                    color="primary"
                                                    size="sm"
                                                    onClick={() => handleDownload(job.videoUrl!, job.prompt)}
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
