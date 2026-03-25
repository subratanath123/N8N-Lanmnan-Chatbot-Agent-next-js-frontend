'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';
import PageHeader from '@/component/PageHeader';
import { MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import { useAuth } from '@clerk/nextjs';

interface ProductPhotoJob {
    id: string;
    originalImageUrl: string;
    backgroundType: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    resultUrl?: string;
    error?: string;
    createdAt: string;
}

const backgroundOptions = [
    { value: 'white', label: 'Clean White', description: 'Professional white background' },
    { value: 'gradient', label: 'Gradient', description: 'Modern gradient background' },
    { value: 'lifestyle', label: 'Lifestyle Scene', description: 'Product in realistic setting' },
    { value: 'custom', label: 'Custom Background', description: 'Describe your own background' }
];

export default function AIProductPhotoPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [backgroundType, setBackgroundType] = useState<'white' | 'gradient' | 'custom' | 'lifestyle'>('white');
    const [customPrompt, setCustomPrompt] = useState('');
    const [processing, setProcessing] = useState(false);
    const [jobs, setJobs] = useState<ProductPhotoJob[]>([]);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

    const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
        if (collapsed !== undefined) {
            setSidebarCollapsed(collapsed);
        }
    };

    const handleNavItemClick = (itemName: string, itemHref: string) => {
        if (itemName === 'AI Product Photo') return;
        if (itemHref && itemHref !== '#') {
            router.push(itemHref);
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem('ai_product_photo_jobs');
        if (stored) {
            try {
                setJobs(JSON.parse(stored));
            } catch (err) {
                console.error('Failed to load jobs:', err);
            }
        }
    }, []);

    useEffect(() => {
        if (jobs.length > 0) {
            localStorage.setItem('ai_product_photo_jobs', JSON.stringify(jobs));
        }
    }, [jobs]);

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
            const res = await fetch(`${backendUrl}/v1/api/ai-product-photo/status/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...data } : j));
            }
        } catch (err) {
            console.error('Status check failed:', err);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleGenerate = async () => {
        if (!selectedFile) {
            alert('Please select a product image');
            return;
        }

        try {
            setProcessing(true);
            const token = await getToken();
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('backgroundType', backgroundType);
            if (backgroundType === 'custom') {
                formData.append('customPrompt', customPrompt);
            }

            const res = await fetch(`${backendUrl}/v1/api/ai-product-photo/generate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Generation failed');
            }

            const data = await res.json();
            const newJob: ProductPhotoJob = {
                id: data.jobId,
                originalImageUrl: previewUrl,
                backgroundType: backgroundType === 'custom' ? customPrompt : backgroundType,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            setJobs(prev => [newJob, ...prev]);
            setSelectedFile(null);
            setPreviewUrl('');
            setCustomPrompt('');

        } catch (err) {
            alert(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setProcessing(false);
        }
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
                    title="AI Product Photo"
                    subtitle="Transform product images with AI-generated backgrounds"
                    icon={
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                        </svg>
                    }
                />

                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
                                <MDBIcon fas icon="camera-retro" style={{ color: '#7c3aed' }} />
                                Create Product Photo
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Upload your product image and choose a professional background
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
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
                                    Product Image *
                                </label>
                                <div 
                                    style={{
                                        border: '2px dashed #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '32px',
                                        textAlign: 'center',
                                        background: '#f8fafc',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => document.getElementById('product-upload')?.click()}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#7c3aed';
                                        e.currentTarget.style.background = '#faf5ff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.background = '#f8fafc';
                                    }}
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '200px', 
                                            borderRadius: '8px' 
                                        }} />
                                    ) : (
                                        <>
                                            <MDBIcon fas icon="box-open" style={{ 
                                                fontSize: '40px', 
                                                color: '#cbd5e1', 
                                                marginBottom: '12px' 
                                            }} />
                                            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
                                                Click to upload product
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                                                PNG with transparent background works best
                                            </div>
                                        </>
                                    )}
                                    <input 
                                        id="product-upload" 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFileSelect} 
                                        style={{ display: 'none' }} 
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ 
                                    fontSize: '12px', 
                                    fontWeight: 600, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.05em', 
                                    color: '#64748b', 
                                    marginBottom: '12px', 
                                    display: 'block' 
                                }}>
                                    Background Style
                                </label>
                                {backgroundOptions.map((opt) => (
                                    <div 
                                        key={opt.value}
                                        onClick={() => setBackgroundType(opt.value as any)}
                                        style={{
                                            padding: '14px',
                                            border: backgroundType === opt.value ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            marginBottom: '10px',
                                            cursor: 'pointer',
                                            background: backgroundType === opt.value ? '#faf5ff' : '#fff',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (backgroundType !== opt.value) {
                                                e.currentTarget.style.borderColor = '#cbd5e1';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (backgroundType !== opt.value) {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                            }
                                        }}
                                    >
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                                            {opt.label}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                            {opt.description}
                                        </div>
                                    </div>
                                ))}
                                {backgroundType === 'custom' && (
                                    <textarea
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        placeholder="Describe the background (e.g., 'Wooden table with plants')"
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            marginTop: '10px'
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        <MDBBtn 
                            color="primary" 
                            onClick={handleGenerate}
                            disabled={processing || !selectedFile || (backgroundType === 'custom' && !customPrompt.trim())}
                            style={{ 
                                borderRadius: '8px', 
                                padding: '12px 32px', 
                                fontSize: '14px', 
                                fontWeight: 600, 
                                boxShadow: processing ? 'none' : '0 2px 8px rgba(124, 58, 237, 0.25)' 
                            }}
                        >
                            {processing ? (
                                <>
                                    <MDBIcon fas icon="spinner" spin className="me-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <MDBIcon fas icon="camera" className="me-2" />
                                    Generate Product Photo
                                </>
                            )}
                        </MDBBtn>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ 
                            fontSize: '12px', 
                            fontWeight: 700, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.08em', 
                            color: '#9ca3af' 
                        }}>
                            GENERATED PHOTOS
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
                                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                margin: '0 auto 20px' 
                            }}>
                                <MDBIcon fas icon="camera" style={{ fontSize: '36px', color: '#fff' }} />
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                                No product photos yet
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
                                Upload a product image and generate professional photos with AI backgrounds
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                            {jobs.map((job) => (
                                <div key={job.id} style={{ 
                                    background: '#fff', 
                                    borderRadius: '12px', 
                                    overflow: 'hidden', 
                                    border: '1px solid #e2e8f0' 
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                        <div style={{ position: 'relative', paddingTop: '100%', background: '#f1f5f9' }}>
                                            <img 
                                                src={job.originalImageUrl} 
                                                alt="Original" 
                                                style={{ 
                                                    position: 'absolute', 
                                                    top: 0, 
                                                    left: 0, 
                                                    width: '100%', 
                                                    height: '100%', 
                                                    objectFit: 'cover' 
                                                }} 
                                            />
                                            <div style={{ 
                                                position: 'absolute', 
                                                top: '8px', 
                                                left: '8px', 
                                                background: 'rgba(0,0,0,0.6)', 
                                                color: '#fff', 
                                                padding: '4px 8px', 
                                                borderRadius: '4px', 
                                                fontSize: '11px', 
                                                fontWeight: 600 
                                            }}>
                                                ORIGINAL
                                            </div>
                                        </div>
                                        <div style={{ 
                                            position: 'relative', 
                                            paddingTop: '100%', 
                                            background: job.status === 'completed' ? '#f1f5f9' : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' 
                                        }}>
                                            {job.status === 'completed' && job.resultUrl ? (
                                                <>
                                                    <img 
                                                        src={job.resultUrl} 
                                                        alt="Result" 
                                                        style={{ 
                                                            position: 'absolute', 
                                                            top: 0, 
                                                            left: 0, 
                                                            width: '100%', 
                                                            height: '100%', 
                                                            objectFit: 'cover' 
                                                        }} 
                                                    />
                                                    <div style={{ 
                                                        position: 'absolute', 
                                                        top: '8px', 
                                                        left: '8px', 
                                                        background: 'rgba(34,197,94,0.9)', 
                                                        color: '#fff', 
                                                        padding: '4px 8px', 
                                                        borderRadius: '4px', 
                                                        fontSize: '11px', 
                                                        fontWeight: 600 
                                                    }}>
                                                        AI PHOTO
                                                    </div>
                                                </>
                                            ) : job.status === 'failed' ? (
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    top: '50%', 
                                                    left: '50%', 
                                                    transform: 'translate(-50%, -50%)', 
                                                    textAlign: 'center', 
                                                    color: '#fff' 
                                                }}>
                                                    <MDBIcon fas icon="times" style={{ fontSize: '32px' }} />
                                                </div>
                                            ) : (
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    top: '50%', 
                                                    left: '50%', 
                                                    transform: 'translate(-50%, -50%)', 
                                                    textAlign: 'center', 
                                                    color: '#fff' 
                                                }}>
                                                    <MDBIcon fas icon="spinner" spin style={{ fontSize: '32px' }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '6px', 
                                                padding: '5px 12px',
                                                background: job.status === 'completed' ? '#dcfce7' : job.status === 'failed' ? '#fee2e2' : '#fef3c7',
                                                color: job.status === 'completed' ? '#166534' : job.status === 'failed' ? '#991b1b' : '#92400e',
                                                borderRadius: '6px', 
                                                fontSize: '11px', 
                                                fontWeight: 700, 
                                                textTransform: 'uppercase' 
                                            }}>
                                                {job.status === 'processing' && (
                                                    <MDBIcon fas icon="spinner" spin style={{ fontSize: '10px' }} />
                                                )}
                                                {job.status}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                {new Date(job.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div style={{ 
                                            fontSize: '13px', 
                                            color: '#475569', 
                                            marginBottom: job.status === 'completed' ? '14px' : '0' 
                                        }}>
                                            Background: <strong>{job.backgroundType}</strong>
                                        </div>
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
                                                    onClick={() => window.open(job.resultUrl, '_blank')}
                                                    style={{ 
                                                        borderRadius: '6px', 
                                                        flex: 1, 
                                                        fontSize: '12px', 
                                                        fontWeight: 600 
                                                    }}
                                                >
                                                    <MDBIcon fas icon="expand" className="me-1" />
                                                    View
                                                </MDBBtn>
                                                <MDBBtn 
                                                    color="primary" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        const link = document.createElement('a');
                                                        link.href = job.resultUrl!;
                                                        link.download = 'product-' + Date.now() + '.png';
                                                        link.click();
                                                    }} 
                                                    style={{ 
                                                        borderRadius: '6px', 
                                                        flex: 1, 
                                                        fontSize: '12px', 
                                                        fontWeight: 600 
                                                    }}
                                                >
                                                    <MDBIcon fas icon="download" className="me-1" />
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
