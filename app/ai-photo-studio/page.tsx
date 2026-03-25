'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LeftSidebar from '@/component/LeftSidebar';
import PageHeader from '@/component/PageHeader';
import { MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import { useAuth } from '@clerk/nextjs';

interface EditJob {
    id: string;
    originalImageUrl: string;
    instruction: string;
    editType: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    resultUrl?: string;
    error?: string;
    createdAt: string;
}

export default function AIPhotoStudioPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [instruction, setInstruction] = useState('');
    const [editType, setEditType] = useState<'edit' | 'enhance' | 'remove-bg' | 'recolor'>('edit');
    const [processing, setProcessing] = useState(false);
    const [jobs, setJobs] = useState<EditJob[]>([]);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

    const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
        if (collapsed !== undefined) {
            setSidebarCollapsed(collapsed);
        }
    };

    const handleNavItemClick = (itemName: string, itemHref: string) => {
        if (itemName === 'AI Photo Studio') return;
        if (itemHref && itemHref !== '#') {
            router.push(itemHref);
        }
    };

    // Load jobs from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('ai_photo_studio_jobs');
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
            localStorage.setItem('ai_photo_studio_jobs', JSON.stringify(jobs));
        }
    }, [jobs]);

    // Poll for status updates
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
            const res = await fetch(`${backendUrl}/v1/api/ai-photo-studio/status/${jobId}`, {
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

    const getEditTypeLabel = (type: string) => {
        switch(type) {
            case 'enhance': return 'Enhance Quality';
            case 'remove-bg': return 'Remove Background';
            case 'recolor': return 'AI Recolor';
            default: return 'Custom Edit';
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleEdit = async () => {
        if (!selectedFile) {
            alert('Please select an image');
            return;
        }

        if (!instruction.trim() && editType === 'edit') {
            alert('Please provide editing instructions');
            return;
        }

        try {
            setProcessing(true);
            const token = await getToken();
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('instruction', instruction.trim());
            formData.append('editType', editType);

            const res = await fetch(`${backendUrl}/v1/api/ai-photo-studio/edit`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Edit failed');
            }

            const data = await res.json();
            const newJob: EditJob = {
                id: data.jobId,
                originalImageUrl: previewUrl,
                instruction: instruction.trim() || getEditTypeLabel(editType),
                editType,
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            setJobs(prev => [newJob, ...prev]);
            setInstruction('');
            setSelectedFile(null);
            setPreviewUrl('');

        } catch (err) {
            alert(err instanceof Error ? err.message : 'Edit failed');
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
                    title="AI Photo Studio"
                    subtitle="Edit and enhance images with AI"
                    icon={
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v6m0 6v6m5.6-13.6l-4.2 4.2m-2.8 2.8l-4.2 4.2m13.6-1.4l-4.2-4.2m-2.8-2.8l-4.2-4.2"/>
                        </svg>
                    }
                />

                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Edit Form Card */}
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
                                Edit Photo with AI
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Upload an image and describe how you want to edit it
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                            {/* Upload Section */}
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
                                    Upload Image *
                                </label>
                                <div style={{
                                    border: '2px dashed #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '32px',
                                    textAlign: 'center',
                                    background: '#f8fafc',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                                onClick={() => document.getElementById('file-upload')?.click()}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#7c3aed';
                                    e.currentTarget.style.background = '#faf5ff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.background = '#f8fafc';
                                }}>
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '200px',
                                            borderRadius: '8px'
                                        }} />
                                    ) : (
                                        <>
                                            <MDBIcon fas icon="cloud-upload-alt" style={{ fontSize: '40px', color: '#cbd5e1', marginBottom: '12px' }} />
                                            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
                                                Click to upload image
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                                                PNG, JPG, WEBP (max 10MB)
                                            </div>
                                        </>
                                    )}
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                                {selectedFile && (
                                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                                        {selectedFile.name}
                                    </div>
                                )}
                            </div>

                            {/* Edit Options */}
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
                                    Edit Type
                                </label>
                                <select
                                    value={editType}
                                    onChange={(e) => setEditType(e.target.value as any)}
                                    disabled={processing}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: '#fff',
                                        cursor: 'pointer',
                                        marginBottom: '16px'
                                    }}
                                >
                                    <option value="edit">Custom Edit (with instructions)</option>
                                    <option value="enhance">Enhance Quality</option>
                                    <option value="remove-bg">Remove Background</option>
                                    <option value="recolor">AI Recolor</option>
                                </select>

                                {editType === 'edit' && (
                                    <>
                                        <label style={{ 
                                            fontSize: '12px', 
                                            fontWeight: 600, 
                                            textTransform: 'uppercase', 
                                            letterSpacing: '0.05em',
                                            color: '#64748b', 
                                            marginBottom: '8px', 
                                            display: 'block' 
                                        }}>
                                            Edit Instructions *
                                        </label>
                                        <textarea
                                            value={instruction}
                                            onChange={(e) => setInstruction(e.target.value)}
                                            placeholder="Describe what you want to change (e.g., 'Change the sky to sunset', 'Add mountains in background')"
                                            disabled={processing}
                                            rows={6}
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                fontFamily: 'inherit',
                                                resize: 'vertical',
                                                lineHeight: '1.5'
                                            }}
                                        />
                                    </>
                                )}

                                {editType !== 'edit' && (
                                    <div style={{
                                        padding: '16px',
                                        background: '#f0fdf4',
                                        border: '1px solid #bbf7d0',
                                        borderRadius: '8px',
                                        marginTop: '10px'
                                    }}>
                                        <div style={{ fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'start', gap: '8px' }}>
                                            <MDBIcon fas icon="info-circle" style={{ marginTop: '2px' }} />
                                            <div>
                                                <strong>{getEditTypeLabel(editType)}</strong> will be applied automatically.
                                                No additional instructions needed.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <MDBBtn
                            color="primary"
                            onClick={handleEdit}
                            disabled={processing || !selectedFile || (editType === 'edit' && !instruction.trim())}
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
                                    <MDBIcon fas icon="wand-magic-sparkles" className="me-2" />
                                    Apply AI Edit
                                </>
                            )}
                        </MDBBtn>
                    </div>

                    {/* Edit History */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ 
                            fontSize: '12px', 
                            fontWeight: 700, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.08em', 
                            color: '#9ca3af'
                        }}>
                            EDIT HISTORY
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
                                margin: '0 auto 20px'
                            }}>
                                <MDBIcon fas icon="adjust" style={{ fontSize: '36px', color: '#fff' }} />
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                                No edits yet
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
                                Upload an image and apply AI-powered edits
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
                                    {/* Before/After */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                        <div style={{ position: 'relative', paddingTop: '100%', background: '#f1f5f9' }}>
                                            <img src={job.originalImageUrl} alt="Original" style={{
                                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover'
                                            }} />
                                            <div style={{
                                                position: 'absolute', top: '8px', left: '8px',
                                                background: 'rgba(0,0,0,0.6)', color: '#fff',
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600
                                            }}>BEFORE</div>
                                        </div>
                                        <div style={{ position: 'relative', paddingTop: '100%', background: job.status === 'completed' ? '#f1f5f9' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                            {job.status === 'completed' && job.resultUrl ? (
                                                <>
                                                    <img src={job.resultUrl} alt="After" style={{
                                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover'
                                                    }} />
                                                    <div style={{
                                                        position: 'absolute', top: '8px', left: '8px',
                                                        background: 'rgba(34,197,94,0.9)', color: '#fff',
                                                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600
                                                    }}>AFTER</div>
                                                </>
                                            ) : job.status === 'failed' ? (
                                                <div style={{
                                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                                    textAlign: 'center', color: '#fff'
                                                }}>
                                                    <MDBIcon fas icon="times" style={{ fontSize: '32px' }} />
                                                </div>
                                            ) : (
                                                <div style={{
                                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                                    textAlign: 'center', color: '#fff'
                                                }}>
                                                    <MDBIcon fas icon="spinner" spin style={{ fontSize: '32px' }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '5px 12px',
                                                background: job.status === 'completed' ? '#dcfce7' : job.status === 'failed' ? '#fee2e2' : '#fef3c7',
                                                color: job.status === 'completed' ? '#166534' : job.status === 'failed' ? '#991b1b' : '#92400e',
                                                borderRadius: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase'
                                            }}>
                                                {job.status === 'processing' && <MDBIcon fas icon="spinner" spin style={{ fontSize: '10px' }} />}
                                                {job.status}
                                            </span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                {new Date(job.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', marginBottom: job.status === 'completed' ? '14px' : '0' }}>
                                            {job.instruction}
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
                                                    link.download = 'edited-' + Date.now() + '.png';
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
