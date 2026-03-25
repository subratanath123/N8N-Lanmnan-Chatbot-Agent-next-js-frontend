'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';
import PageHeader from '@/component/PageHeader';
import { MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import { useAuth } from '@clerk/nextjs';

interface StudioJob {
    id: string;
    originalImageUrl: string;
    sceneType: string;
    lighting: string;
    angle: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    resultUrl?: string;
    error?: string;
    createdAt: string;
}

export default function AIProductStudioPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [sceneType, setSceneType] = useState<'studio' | 'outdoor' | 'lifestyle' | 'luxury'>('studio');
    const [lighting, setLighting] = useState<'soft' | 'dramatic' | 'natural' | 'neon'>('soft');
    const [angle, setAngle] = useState<'front' | 'angle' | 'top' | '360'>('front');
    const [processing, setProcessing] = useState(false);
    const [jobs, setJobs] = useState<StudioJob[]>([]);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

    const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
        if (collapsed !== undefined) setSidebarCollapsed(collapsed);
    };

    const handleNavItemClick = (itemName: string, itemHref: string) => {
        if (itemName === 'AI Product Studio') return;
        if (itemHref && itemHref !== '#') router.push(itemHref);
    };

    useEffect(() => {
        const stored = localStorage.getItem('ai_product_studio_jobs');
        if (stored) {
            try { setJobs(JSON.parse(stored)); } 
            catch (err) { console.error('Failed to load jobs:', err); }
        }
    }, []);

    useEffect(() => {
        if (jobs.length > 0) {
            localStorage.setItem('ai_product_studio_jobs', JSON.stringify(jobs));
        }
    }, [jobs]);

    useEffect(() => {
        const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');
        if (pendingJobs.length === 0) return;
        const pollInterval = setInterval(async () => {
            for (const job of pendingJobs) await checkJobStatus(job.id);
        }, 3000);
        return () => clearInterval(pollInterval);
    }, [jobs]);

    const checkJobStatus = async (jobId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${backendUrl}/v1/api/ai-product-studio/status/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...data } : j));
            }
        } catch (err) { console.error('Status check failed:', err); }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleGenerate = async () => {
        if (!selectedFile) { alert('Please select a product image'); return; }

        try {
            setProcessing(true);
            const token = await getToken();
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('sceneType', sceneType);
            formData.append('lighting', lighting);
            formData.append('angle', angle);

            const res = await fetch(`${backendUrl}/v1/api/ai-product-studio/generate`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Generation failed');
            }

            const data = await res.json();
            const newJob: StudioJob = {
                id: data.jobId,
                originalImageUrl: previewUrl,
                sceneType, lighting, angle,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            setJobs(prev => [newJob, ...prev]);
            setSelectedFile(null);
            setPreviewUrl('');

        } catch (err) {
            alert(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="full-height-layout">
            <LeftSidebar onDrawerStateChange={handleDrawerStateChange} onNavItemClick={handleNavItemClick} />

            <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <PageHeader
                    breadcrumb={['AI Social Media']}
                    title="AI Product Studio"
                    subtitle="Create professional product visualizations with AI"
                    icon={
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                        </svg>
                    }
                />

                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', marginBottom: '28px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MDBIcon fas icon="cube" style={{ color: '#7c3aed' }} />
                                Create Studio Visualization
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>Professional product photography with full control over scene, lighting, and angles</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '28px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '8px', display: 'block' }}>Product Image *</label>
                                <div style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '32px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer' }}
                                    onClick={() => document.getElementById('studio-upload')?.click()}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = '#faf5ff'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}>
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px' }} />
                                    ) : (
                                        <>
                                            <MDBIcon fas icon="box" style={{ fontSize: '36px', color: '#cbd5e1', marginBottom: '10px' }} />
                                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Upload product</div>
                                        </>
                                    )}
                                    <input id="studio-upload" type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '10px', display: 'block' }}>Scene Type</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                        {[
                                            { value: 'studio', icon: 'building', label: 'Studio' },
                                            { value: 'outdoor', icon: 'tree', label: 'Outdoor' },
                                            { value: 'lifestyle', icon: 'home', label: 'Lifestyle' },
                                            { value: 'luxury', icon: 'gem', label: 'Luxury' }
                                        ].map(opt => (
                                            <div key={opt.value} onClick={() => setSceneType(opt.value as any)}
                                                style={{ padding: '12px', border: sceneType === opt.value ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                                    borderRadius: '8px', cursor: 'pointer', textAlign: 'center', background: sceneType === opt.value ? '#faf5ff' : '#fff', transition: 'all 0.2s' }}>
                                                <MDBIcon fas icon={opt.icon} style={{ fontSize: '20px', color: sceneType === opt.value ? '#7c3aed' : '#94a3b8', marginBottom: '6px' }} />
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: sceneType === opt.value ? '#7c3aed' : '#64748b' }}>{opt.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '10px', display: 'block' }}>Lighting</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                        {[
                                            { value: 'soft', icon: 'sun', label: 'Soft' },
                                            { value: 'dramatic', icon: 'bolt', label: 'Dramatic' },
                                            { value: 'natural', icon: 'cloud-sun', label: 'Natural' },
                                            { value: 'neon', icon: 'lightbulb', label: 'Neon' }
                                        ].map(opt => (
                                            <div key={opt.value} onClick={() => setLighting(opt.value as any)}
                                                style={{ padding: '12px', border: lighting === opt.value ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                                    borderRadius: '8px', cursor: 'pointer', textAlign: 'center', background: lighting === opt.value ? '#faf5ff' : '#fff', transition: 'all 0.2s' }}>
                                                <MDBIcon fas icon={opt.icon} style={{ fontSize: '20px', color: lighting === opt.value ? '#7c3aed' : '#94a3b8', marginBottom: '6px' }} />
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: lighting === opt.value ? '#7c3aed' : '#64748b' }}>{opt.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '10px', display: 'block' }}>Camera Angle</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                        {[
                                            { value: 'front', icon: 'arrows-alt-h', label: 'Front' },
                                            { value: 'angle', icon: 'arrow-right', label: 'Angled' },
                                            { value: 'top', icon: 'arrow-down', label: 'Top Down' },
                                            { value: '360', icon: 'sync-alt', label: '360°' }
                                        ].map(opt => (
                                            <div key={opt.value} onClick={() => setAngle(opt.value as any)}
                                                style={{ padding: '12px', border: angle === opt.value ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                                    borderRadius: '8px', cursor: 'pointer', textAlign: 'center', background: angle === opt.value ? '#faf5ff' : '#fff', transition: 'all 0.2s' }}>
                                                <MDBIcon fas icon={opt.icon} style={{ fontSize: '20px', color: angle === opt.value ? '#7c3aed' : '#94a3b8', marginBottom: '6px' }} />
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: angle === opt.value ? '#7c3aed' : '#64748b' }}>{opt.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <MDBBtn color="primary" onClick={handleGenerate} disabled={processing || !selectedFile}
                            style={{ borderRadius: '8px', padding: '12px 32px', fontSize: '14px', fontWeight: 600, boxShadow: processing ? 'none' : '0 2px 8px rgba(124, 58, 237, 0.25)' }}>
                            {processing ? <><MDBIcon fas icon="spinner" spin className="me-2" />Processing...</> : <><MDBIcon fas icon="magic" className="me-2" />Generate Studio Shot</>}
                        </MDBBtn>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af' }}>STUDIO SHOTS</div>
                    </div>

                    {jobs.length === 0 ? (
                        <div style={{ background: '#fff', borderRadius: '12px', padding: '60px 40px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <MDBIcon fas icon="cube" style={{ fontSize: '36px', color: '#fff' }} />
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>No studio shots yet</div>
                            <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
                                Upload a product and create professional studio visualizations
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                            {jobs.map((job) => (
                                <div key={job.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <div style={{ position: 'relative', paddingTop: '75%', background: job.status === 'completed' ? '#000' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                        {job.status === 'completed' && job.resultUrl ? (
                                            <img src={job.resultUrl} alt="Studio Shot" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : job.status === 'failed' ? (
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#fff' }}>
                                                <MDBIcon fas icon="exclamation-triangle" style={{ fontSize: '32px' }} />
                                            </div>
                                        ) : (
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#fff' }}>
                                                <MDBIcon fas icon="spinner" spin style={{ fontSize: '36px', marginBottom: '8px' }} />
                                                <div style={{ fontSize: '12px' }}>Creating...</div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
                                                background: job.status === 'completed' ? '#dcfce7' : job.status === 'failed' ? '#fee2e2' : '#fef3c7',
                                                color: job.status === 'completed' ? '#166534' : job.status === 'failed' ? '#991b1b' : '#92400e',
                                                borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                                                {job.status === 'processing' && <MDBIcon fas icon="spinner" spin style={{ fontSize: '10px' }} />}
                                                {job.status}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(job.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                                            <div><strong>Scene:</strong> {job.sceneType}</div>
                                            <div><strong>Lighting:</strong> {job.lighting}</div>
                                            <div><strong>Angle:</strong> {job.angle}</div>
                                        </div>
                                        {job.status === 'completed' && (
                                            <div style={{ display: 'flex', gap: '10px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                                                <MDBBtn outline color="dark" size="sm" onClick={() => window.open(job.resultUrl, '_blank')}
                                                    style={{ borderRadius: '6px', flex: 1, fontSize: '12px', fontWeight: 600 }}>
                                                    <MDBIcon fas icon="expand" className="me-1" />View
                                                </MDBBtn>
                                                <MDBBtn color="primary" size="sm" onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = job.resultUrl!;
                                                    link.download = 'studio-' + Date.now() + '.png';
                                                    link.click();
                                                }} style={{ borderRadius: '6px', flex: 1, fontSize: '12px', fontWeight: 600 }}>
                                                    <MDBIcon fas icon="download" className="me-1" />Save
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
                .full-height-layout { display: flex; width: 100%; min-height: 100vh; position: relative; background-color: #f8f9fa; }
                .main-content { flex: 1; margin-left: 280px; padding: 0; min-height: 100vh; background-color: #f8f9fa;
                    transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1); overflow-x: hidden; position: relative; z-index: 1; }
                .main-content.collapsed { margin-left: 60px; }
                @media (max-width: 768px) { .main-content { margin-left: 0 !important; padding: 1rem !important; } }
            `}</style>
        </div>
    );
}
