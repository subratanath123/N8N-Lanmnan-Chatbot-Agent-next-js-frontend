'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/component/PageHeader';
import { MDBBtn, MDBCard, MDBCardBody, MDBIcon, MDBInput, MDBTable, MDBTableHead, MDBTableBody } from 'mdb-react-ui-kit';
import { useAuth, useUser } from '@clerk/nextjs';

interface TeamMember {
    id: string;
    email: string;
    name: string;
    role: 'Admin' | 'Editor' | 'Viewer';
    joinedDate: string;
}

export default function TeamMembersPage() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'Admin' | 'Editor' | 'Viewer'>('Viewer');
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        loadTeamMembers();
    }, []);

    const loadTeamMembers = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

            const res = await fetch(`${backendUrl}/v1/api/team/members`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setMembers(data || []);
            } else if (res.status === 404) {
                // No team members yet, show empty state
                setMembers([]);
            } else {
                setError('Failed to load team members');
            }
        } catch (err) {
            console.error('Error loading team members:', err);
            setError('Error loading team members');
        } finally {
            setLoading(false);
        }
    };

    const handleInviteMember = async () => {
        if (!inviteEmail.trim()) {
            setError('Please enter an email address');
            return;
        }

        try {
            setInviting(true);
            const token = await getToken();
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

            const res = await fetch(`${backendUrl}/v1/api/team/invite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: inviteRole
                })
            });

            if (res.ok) {
                setInviteEmail('');
                setShowInviteModal(false);
                await loadTeamMembers();
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to send invite');
            }
        } catch (err) {
            console.error('Error inviting member:', err);
            setError('Error sending invite');
        } finally {
            setInviting(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this team member?')) return;

        try {
            const token = await getToken();
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

            const res = await fetch(`${backendUrl}/v1/api/team/members/${memberId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                await loadTeamMembers();
            } else {
                setError('Failed to remove team member');
            }
        } catch (err) {
            console.error('Error removing member:', err);
            setError('Error removing member');
        }
    };

    return (
        <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: '#f8f9fa' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <PageHeader
                    title="Team Members"
                    subtitle="Manage your team and invite new members"
                    icon="users"
                    breadcrumb={['Account']}
                />

                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
                    {/* Invite Button */}
                    <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                        <MDBBtn
                            color="primary"
                            onClick={() => setShowInviteModal(true)}
                            style={{ borderRadius: '6px' }}
                        >
                            <MDBIcon fas icon="plus" className="me-2" />
                            Invite Team Member
                        </MDBBtn>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '6px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <MDBIcon fas icon="exclamation-circle" />
                            {error}
                        </div>
                    )}

                    {/* Team Members Card */}
                    <MDBCard style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <MDBCardBody>
                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                                        <MDBIcon fas icon="spinner" spin className="me-2" />
                                        Loading team members...
                                    </div>
                                </div>
                            ) : members.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <MDBIcon fas icon="users" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '16px' }} />
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                                        No team members yet
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                                        Invite your first team member to get started
                                    </div>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <MDBTable hover>
                                        <MDBTableHead>
                                            <tr style={{ background: '#f8fafc' }}>
                                                <th style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>Name</th>
                                                <th style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>Email</th>
                                                <th style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>Role</th>
                                                <th style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>Joined</th>
                                                <th style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>Actions</th>
                                            </tr>
                                        </MDBTableHead>
                                        <MDBTableBody>
                                            {members.map((member) => (
                                                <tr key={member.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>
                                                        <MDBIcon fas icon="user-circle" className="me-2" />
                                                        {member.name}
                                                    </td>
                                                    <td style={{ fontSize: '14px', color: '#64748b' }}>{member.email}</td>
                                                    <td style={{ fontSize: '14px' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '4px 12px',
                                                            background: member.role === 'Admin' ? '#dbeafe' : '#f0fdf4',
                                                            color: member.role === 'Admin' ? '#1e40af' : '#166534',
                                                            borderRadius: '20px',
                                                            fontSize: '12px',
                                                            fontWeight: 600
                                                        }}>
                                                            {member.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                                                        {new Date(member.joinedDate).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ fontSize: '14px' }}>
                                                        <MDBBtn
                                                            outline
                                                            color="danger"
                                                            size="sm"
                                                            onClick={() => handleRemoveMember(member.id)}
                                                            style={{ borderRadius: '4px' }}
                                                        >
                                                            Remove
                                                        </MDBBtn>
                                                    </td>
                                                </tr>
                                            ))}
                                        </MDBTableBody>
                                    </MDBTable>
                                </div>
                            )}
                        </MDBCardBody>
                    </MDBCard>
                </div>

                {/* Invite Modal */}
                {showInviteModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1050
                    }}>
                        <MDBCard style={{
                            width: '100%',
                            maxWidth: '500px',
                            border: 'none',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                        }}>
                            <MDBCardBody>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h5 style={{ marginBottom: 0, fontWeight: 600, color: '#0f172a' }}>
                                        Invite Team Member
                                    </h5>
                                    <button
                                        onClick={() => setShowInviteModal(false)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '24px',
                                            cursor: 'pointer',
                                            color: '#64748b'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', display: 'block' }}>
                                        Email Address
                                    </label>
                                    <MDBInput
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="Enter email address"
                                        disabled={inviting}
                                    />
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', display: 'block' }}>
                                        Role
                                    </label>
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value as 'Admin' | 'Editor' | 'Viewer')}
                                        disabled={inviting}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            background: '#fff',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="Viewer">Viewer - Can view content only</option>
                                        <option value="Editor">Editor - Can edit content</option>
                                        <option value="Admin">Admin - Full access</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <MDBBtn
                                        outline
                                        color="secondary"
                                        onClick={() => setShowInviteModal(false)}
                                        disabled={inviting}
                                        style={{ borderRadius: '6px' }}
                                    >
                                        Cancel
                                    </MDBBtn>
                                    <MDBBtn
                                        color="primary"
                                        onClick={handleInviteMember}
                                        disabled={inviting || !inviteEmail.trim()}
                                        style={{ borderRadius: '6px' }}
                                    >
                                        {inviting ? (
                                            <>
                                                <MDBIcon fas icon="spinner" spin className="me-2" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <MDBIcon fas icon="paper-plane" className="me-2" />
                                                Send Invite
                                            </>
                                        )}
                                    </MDBBtn>
                                </div>
                            </MDBCardBody>
                        </MDBCard>
                    </div>
                )}
            </div>
        </div>
    );
}
