'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';
import PageHeader from '@/component/PageHeader';
import { MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import { useAuth } from '@clerk/nextjs';

interface FaceSwapJob {
    id: string;
    sourceImageUrl: string;
    targetImageUrl: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    resultUrl?: string;
    error?: string;
    createdAt: string;
}

export default function FaceSwapPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [targetFile, setTargetFile] = useState<File | null>(null);
    const [sourcePreview, setSourcePreview] = useState<string>('');
    const [targetPreview, setTargetPreview] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const [jobs, setJobs] = useState<FaceSwapJob[]>([]);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

    const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
        if (collapsed !== undefined) {
            setSidebarCollapsed(collapsed);
        }
    };

    const handleNavItemClick = (itemName: string, itemHref: string) => {
        if (itemName === 'Face Swap') return;
        if (itemHref && itemHref !== '#') {
            router.push(itemHref);
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem('face_swap_jobs');
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
            localStorage.setItem('face_swap_jobs', JSON.stringify(jobs));
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
            const res = await fetch(`${backendUrl}/v1/api/face-swap/status/${jobId}`, {
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

    const handleSourceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSourceFile(file);
            setSourcePreview(URL.createObjectURL(file));
        }
    };

    const handleTargetSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setTargetFile(file);
            setTargetPreview(URL.createObjectURL(file));
        }
    };

    const handleSwap = async () => {
        if (!sourceFile || !targetFile) {
            alert('Please select both source face and target image');
            return;
        }

        try {
            setProcessing(true);
            const token = await getToken();
            const formData = new FormData();
            formData.append('sourceFace', sourceFile);
            formData.append('targetImage', targetFile);

            const res = await fetch(`${backendUrl}/v1/api/face-swap/swap`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Face swap failed');
            }

            const data = await res.json();
            const newJob: FaceSwapJob = {
                id: data.jobId,
                sourceImageUrl: sourcePreview,
                targetImageUrl: targetPreview,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            setJobs(prev => [newJob, ...prev]);
            setSourceFile(null);
            setTargetFile(null);
            setSourcePreview('');
            setTargetPreview('');

        } catch (err) {
            alert(err instanceof Error ? err.message : 'Face swap failed');
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
                    title="Face Swap"
                    subtitle="Swap faces between images with AI precision"
                    icon={
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            <path d="M8 12h8"/>
                            <path d="M12 8v8"/>
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
                                <MDBIcon fas icon="exchange-alt" style={{ color: '#7c3aed' }} />
                                Swap Faces
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Upload a source face and target image to swap faces seamlessly
                            </div>
                        </div>

                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 80px 1fr', 
                            gap: '20px', 
                            marginBottom: '24px', 
                            alignItems: 'center' 
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
                                    Source Face *
                                </label>
                                <div 
                                    style={{ 
                                        border: '2px dashed #e2e8f0', 
                                        borderRadius: '12px', 
                                        padding: '32px', 
                                        textAlign: 'center', 
                                        background: '#f8fafc', 
                                        cursor: 'pointer' 
                                    }}
                                    onClick={() => document.getElementById('source-upload')?.click()}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#7c3aed';
                                        e.currentTarget.style.background = '#faf5ff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.background = '#f8fafc';
                                    }}
                                >
                                    {sourcePreview ? (
                                        <img src={sourcePreview} alt="Source" style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '180px', 
                                            borderRadius: '8px' 
                                        }} />
                                    ) : (
                                        <>
                                            <MDBIcon fas icon="user" style={{ 
                                                fontSize: '36px', 
                                                color: '#cbd5e1', 
                                                marginBottom: '10px' 
                                            }} />
                                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                                                Upload source face
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                                Face to extract
                                            </div>
                                        </>
                                    )}
                                    <input 
                                        id="source-upload" 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleSourceSelect} 
                                        style={{ display: 'none' }} 
                                    />
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', paddingTop: '30px' }}>
                                <MDBIcon fas icon="exchange-alt" style={{ fontSize: '28px', color: '#7c3aed' }} />
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
                                    Target Image *
                                </label>
                                <div 
                                    style={{ 
                                        border: '2px dashed #e2e8f0', 
                                        borderRadius: '12px', 
                                        padding: '32px', 
                                        textAlign: 'center', 
                                        background: '#f8fafc', 
                                        cursor: 'pointer' 
                                    }}
                                    onClick={() => document.getElementById('target-upload')?.click()}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#7c3aed';
                                        e.currentTarget.style.background = '#faf5ff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.background = '#f8fafc';
                                    }}
                                >
                                    {targetPreview ? (
                                        <img src={targetPreview} alt="Target" style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '180px', 
                                            borderRadius: '8px' 
                                        }} />
                                    ) : (
                                        <>
                                            <MDBIcon fas icon="image" style={{ 
                                                fontSize: '36px', 
                                                color: '#cbd5e1', 
                                                marginBottom: '10px' 
                                            }} />
                                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                                                Upload target image
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                                Face to replace
                                            </div>
                                        </>
                                    )}
                                    <input 
                                        id="target-upload" 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleTargetSelect} 
                                        style={{ display: 'none' }} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ 
                            background: '#eff6ff', 
                            border: '1px solid #bfdbfe', 
                            borderRadius: '8px', 
                            padding: '14px', 
                            marginBottom: '20px', 
                            display: 'flex', 
                            gap: '12px' 
                        }}>
                            <MDBIcon fas icon="info-circle" style={{ color: '#2563eb', marginTop: '2px' }} />
                            <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: '1.5' }}>
                                <strong>Tip:</strong> For best results, use high-quality images with clearly visible faces. The source face will be mapped onto the target image.
                            </div>
                        </div>

                        <MDBBtn 
                            color="primary" 
                            onClick={handleSwap}
                            disabled={processing || !sourceFile || !targetFile}
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
                                    <MDBIcon fas icon="random" className="me-2" />
                                    Swap Faces
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
                            SWAP HISTORY
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
                                margin: '0 auto 20px' 
                            }}>
                                <MDBIcon fas icon="user-friends" style={{ fontSize: '36px', color: '#fff' }} />
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                                No face swaps yet
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
                                Upload source and target images to create AI face swaps
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                            {jobs.map((job) => (
                                <div key={job.id} style={{ 
                                    background: '#fff', 
                                    borderRadius: '12px', 
                                    overflow: 'hidden', 
                                    border: '1px solid #e2e8f0' 
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                                        <div style={{ position: 'relative', paddingTop: '100%', background: '#f1f5f9' }}>
                                            <img 
                                                src={job.sourceImageUrl} 
                                                alt="Source" 
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
                                                fontSize: '10px', 
                                                fontWeight: 600 
                                            }}>
                                                SOURCE
                                            </div>
                                        </div>
                                        <div style={{ position: 'relative', paddingTop: '100%', background: '#f1f5f9' }}>
                                            <img 
                                                src={job.targetImageUrl} 
                                                alt="Target" 
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
                                                fontSize: '10px', 
                                                fontWeight: 600 
                                            }}>
                                                TARGET
                                            </div>
                                        </div>
                                        <div style={{ 
                                            position: 'relative', 
                                            paddingTop: '100%', 
                                            background: job.status === 'completed' ? '#f1f5f9' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
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
                                                        fontSize: '10px', 
                                                        fontWeight: 600 
                                                    }}>
                                                        RESULT
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
                                                    <MDBIcon fas icon="times" style={{ fontSize: '28px' }} />
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
                                                    <MDBIcon fas icon="spinner" spin style={{ fontSize: '28px' }} />
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
                                                        link.download = 'faceswap-' + Date.now() + '.png';
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
