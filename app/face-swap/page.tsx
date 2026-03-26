'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';
import PageHeader from '@/component/PageHeader';
import { MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import { useAuth } from '@clerk/nextjs';

interface FaceSwapJob {
    id: string;
    sourcePreviewUrl: string;
    targetPreviewUrl: string;
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
    const [sourcePreviewUrl, setSourcePreviewUrl] = useState('');
    const [targetPreviewUrl, setTargetPreviewUrl] = useState('');
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
                console.error('Failed to load face swap jobs:', err);
            }
        }
    }, []);

    useEffect(() => {
        if (jobs.length > 0) {
            localStorage.setItem('face_swap_jobs', JSON.stringify(jobs));
        }
    }, [jobs]);

    useEffect(() => {
        const pendingJobs = jobs.filter((j) => j.status === 'pending' || j.status === 'processing');
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
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setJobs((prev) =>
                    prev.map((j) =>
                        j.id === jobId
                            ? {
                                  ...j,
                                  status: data.status,
                                  resultUrl: data.resultUrl,
                                  error: data.error,
                              }
                            : j
                    )
                );
            }
        } catch (err) {
            console.error('Face swap status check failed:', err);
        }
    };

    const handleSourceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
            setSourceFile(file);
            setSourcePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleTargetSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (targetPreviewUrl) URL.revokeObjectURL(targetPreviewUrl);
            setTargetFile(file);
            setTargetPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSwap = async () => {
        if (!sourceFile || !targetFile) {
            alert('Please upload both a source face image and a target image.');
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
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error((errBody as { error?: string; message?: string }).error || (errBody as { message?: string }).message || 'Face swap failed');
            }

            const data = await res.json();
            const newJob: FaceSwapJob = {
                id: data.jobId,
                sourcePreviewUrl,
                targetPreviewUrl,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };

            setJobs((prev) => [newJob, ...prev]);
            setSourceFile(null);
            setTargetFile(null);
            setSourcePreviewUrl('');
            setTargetPreviewUrl('');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Face swap failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="full-height-layout">
            <LeftSidebar onDrawerStateChange={handleDrawerStateChange} onNavItemClick={handleNavItemClick} />

            <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <PageHeader
                    breadcrumb={['AI IMAGE']}
                    title="Face Swap"
                    subtitle="Place a face from one photo onto another image"
                    icon={
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="7" r="3" />
                            <circle cx="17" cy="17" r="3" />
                            <path d="M21 3L3 21" />
                            <path d="M6 16l2-2" />
                            <path d="M16 6l2-2" />
                        </svg>
                    }
                />

                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '28px',
                            marginBottom: '28px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                    >
                        <div style={{ marginBottom: '24px' }}>
                            <div
                                style={{
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    marginBottom: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <MDBIcon fas icon="user-friends" style={{ color: '#7c3aed' }} />
                                Create face swap
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Upload a <strong>source face</strong> (the face to use) and a <strong>target image</strong> (the scene or portrait to edit). The
                                model maps the source face onto the target.
                            </div>
                        </div>

                        <div className="face-swap-upload-grid">
                            <div>
                                <label
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: '#64748b',
                                        marginBottom: '8px',
                                        display: 'block',
                                    }}
                                >
                                    Source face *
                                </label>
                                <div
                                    style={{
                                        border: '2px dashed #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '32px',
                                        textAlign: 'center',
                                        background: '#f8fafc',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        minHeight: '220px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    onClick={() => document.getElementById('face-swap-source')?.click()}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#7c3aed';
                                        e.currentTarget.style.background = '#faf5ff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.background = '#f8fafc';
                                    }}
                                >
                                    {sourcePreviewUrl ? (
                                        <img
                                            src={sourcePreviewUrl}
                                            alt="Source face"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '200px',
                                                borderRadius: '8px',
                                                objectFit: 'contain',
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <MDBIcon
                                                fas
                                                icon="smile"
                                                style={{
                                                    fontSize: '40px',
                                                    color: '#cbd5e1',
                                                    marginBottom: '12px',
                                                }}
                                            />
                                            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Face to copy</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Clear, front-facing works best</div>
                                        </>
                                    )}
                                    <input id="face-swap-source" type="file" accept="image/*" onChange={handleSourceSelect} style={{ display: 'none' }} />
                                </div>
                            </div>

                            <div>
                                <label
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: '#64748b',
                                        marginBottom: '8px',
                                        display: 'block',
                                    }}
                                >
                                    Target image *
                                </label>
                                <div
                                    style={{
                                        border: '2px dashed #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '32px',
                                        textAlign: 'center',
                                        background: '#f8fafc',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        minHeight: '220px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    onClick={() => document.getElementById('face-swap-target')?.click()}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#7c3aed';
                                        e.currentTarget.style.background = '#faf5ff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.background = '#f8fafc';
                                    }}
                                >
                                    {targetPreviewUrl ? (
                                        <img
                                            src={targetPreviewUrl}
                                            alt="Target"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '200px',
                                                borderRadius: '8px',
                                                objectFit: 'contain',
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <MDBIcon
                                                fas
                                                icon="image"
                                                style={{
                                                    fontSize: '40px',
                                                    color: '#cbd5e1',
                                                    marginBottom: '12px',
                                                }}
                                            />
                                            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Image to edit</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>Full scene or portrait</div>
                                        </>
                                    )}
                                    <input id="face-swap-target" type="file" accept="image/*" onChange={handleTargetSelect} style={{ display: 'none' }} />
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: '14px 16px',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                marginBottom: '20px',
                                fontSize: '13px',
                                color: '#475569',
                                lineHeight: 1.5,
                            }}
                        >
                            <MDBIcon fas icon="info-circle" className="me-2" style={{ color: '#7c3aed' }} />
                            Use a well-lit face for the source. The target should show the head or body where you want the new face applied. Processing time is
                            often 20–60 seconds depending on resolution.
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
                                boxShadow: processing ? 'none' : '0 2px 8px rgba(124, 58, 237, 0.25)',
                            }}
                        >
                            {processing ? (
                                <>
                                    <MDBIcon fas icon="spinner" spin className="me-2" />
                                    Starting…
                                </>
                            ) : (
                                <>
                                    <MDBIcon fas icon="exchange-alt" className="me-2" />
                                    Swap face
                                </>
                            )}
                        </MDBBtn>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div
                            style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: '#9ca3af',
                            }}
                        >
                            YOUR FACE SWAPS
                        </div>
                    </div>

                    {jobs.length === 0 ? (
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: '12px',
                                padding: '60px 40px',
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                }}
                            >
                                <MDBIcon fas icon="user-friends" style={{ fontSize: '36px', color: '#fff' }} />
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>No face swaps yet</div>
                            <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
                                Add a source face and a target image, then run a swap to see results here.
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    style={{
                                        background: '#fff',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '1px solid #e2e8f0',
                                    }}
                                >
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                        <div style={{ position: 'relative', paddingTop: '100%', background: '#f1f5f9' }}>
                                            <img
                                                src={job.sourcePreviewUrl}
                                                alt="Source"
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    left: '8px',
                                                    background: 'rgba(0,0,0,0.6)',
                                                    color: '#fff',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                SOURCE
                                            </div>
                                        </div>
                                        <div style={{ position: 'relative', paddingTop: '100%', background: '#f1f5f9' }}>
                                            <img
                                                src={job.targetPreviewUrl}
                                                alt="Target"
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    left: '8px',
                                                    background: 'rgba(0,0,0,0.6)',
                                                    color: '#fff',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                TARGET
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ position: 'relative', paddingTop: '56%', background: '#0f172a' }}>
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
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        left: '8px',
                                                        background: 'rgba(124, 58, 237, 0.95)',
                                                        color: '#fff',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    RESULT
                                                </div>
                                            </>
                                        ) : job.status === 'failed' ? (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    textAlign: 'center',
                                                    color: '#fff',
                                                    padding: '0 16px',
                                                    maxWidth: '100%',
                                                }}
                                            >
                                                <MDBIcon fas icon="times-circle" style={{ fontSize: '28px', marginBottom: '8px' }} />
                                                <div style={{ fontSize: '12px', opacity: 0.95 }}>{job.error || 'Swap failed'}</div>
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    textAlign: 'center',
                                                    color: '#fff',
                                                }}
                                            >
                                                <MDBIcon fas icon="spinner" spin style={{ fontSize: '32px' }} />
                                                <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.9 }}>Processing…</div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '5px 12px',
                                                    background:
                                                        job.status === 'completed'
                                                            ? '#dcfce7'
                                                            : job.status === 'failed'
                                                              ? '#fee2e2'
                                                              : '#fef3c7',
                                                    color:
                                                        job.status === 'completed'
                                                            ? '#166534'
                                                            : job.status === 'failed'
                                                              ? '#991b1b'
                                                              : '#92400e',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                {(job.status === 'pending' || job.status === 'processing') && (
                                                    <MDBIcon fas icon="spinner" spin style={{ fontSize: '10px' }} />
                                                )}
                                                {job.status}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                {new Date(job.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {job.status === 'completed' && job.resultUrl && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '10px',
                                                    paddingTop: '14px',
                                                    borderTop: '1px solid #f1f5f9',
                                                }}
                                            >
                                                <MDBBtn
                                                    outline
                                                    color="dark"
                                                    size="sm"
                                                    onClick={() => window.open(job.resultUrl, '_blank')}
                                                    style={{
                                                        borderRadius: '6px',
                                                        flex: 1,
                                                        fontSize: '12px',
                                                        fontWeight: 600,
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
                                                        link.download = 'face-swap-' + Date.now() + '.png';
                                                        link.click();
                                                    }}
                                                    style={{
                                                        borderRadius: '6px',
                                                        flex: 1,
                                                        fontSize: '12px',
                                                        fontWeight: 600,
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
                .face-swap-upload-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    margin-bottom: 24px;
                }

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

                    .face-swap-upload-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
