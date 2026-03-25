'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import PageHeader from '@/component/PageHeader';
import { MDBBtn, MDBCard, MDBCardBody, MDBInput, MDBIcon } from 'mdb-react-ui-kit';

export default function AccountPage() {
    const { user, isSignedIn } = useUser();

    if (!isSignedIn) {
        return (
            <div style={{ padding: '40px 20px' }}>
                <p>Please sign in to view your account.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: '#f8f9fa' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <PageHeader
                    title="My Account"
                    subtitle="Manage your profile and account settings"
                    icon="user-circle"
                    breadcrumb={['Account']}
                />

                <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
                    {/* Profile Information Card */}
                    <MDBCard className="mb-4" style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <MDBCardBody>
                            <div style={{ marginBottom: '24px' }}>
                                <h5 style={{ marginBottom: '16px', fontWeight: 600, color: '#0f172a' }}>
                                    <MDBIcon fas icon="user" className="me-2" />
                                    Profile Information
                                </h5>
                                <hr style={{ opacity: 0.1 }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', display: 'block' }}>
                                        First Name
                                    </label>
                                    <MDBInput
                                        value={user?.firstName || ''}
                                        disabled
                                        style={{ fontSize: '14px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', display: 'block' }}>
                                        Last Name
                                    </label>
                                    <MDBInput
                                        value={user?.lastName || ''}
                                        disabled
                                        style={{ fontSize: '14px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', display: 'block' }}>
                                    Email Address
                                </label>
                                <MDBInput
                                    value={user?.primaryEmailAddress?.emailAddress || ''}
                                    disabled
                                    style={{ fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', display: 'block' }}>
                                    User ID
                                </label>
                                <MDBInput
                                    value={user?.id || ''}
                                    disabled
                                    style={{ fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ marginTop: '24px' }}>
                                <MDBBtn
                                    color="primary"
                                    onClick={() => window.location.href = '/user-profile'}
                                    style={{ borderRadius: '6px' }}
                                >
                                    <MDBIcon fas icon="edit" className="me-2" />
                                    Edit Profile
                                </MDBBtn>
                            </div>
                        </MDBCardBody>
                    </MDBCard>

                    {/* Account Settings Card */}
                    <MDBCard style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <MDBCardBody>
                            <div style={{ marginBottom: '24px' }}>
                                <h5 style={{ marginBottom: '16px', fontWeight: 600, color: '#0f172a' }}>
                                    <MDBIcon fas icon="cog" className="me-2" />
                                    Account Settings
                                </h5>
                                <hr style={{ opacity: 0.1 }} />
                            </div>

                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div style={{
                                    padding: '16px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    background: '#f8fafc',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                                            Password & Security
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                                            Manage your password and security settings
                                        </div>
                                    </div>
                                    <MDBBtn
                                        outline
                                        color="secondary"
                                        size="sm"
                                        style={{ borderRadius: '6px' }}
                                    >
                                        Manage
                                    </MDBBtn>
                                </div>

                                <div style={{
                                    padding: '16px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    background: '#f8fafc',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                                            Two-Factor Authentication
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                                            Add an extra layer of security to your account
                                        </div>
                                    </div>
                                    <MDBBtn
                                        outline
                                        color="secondary"
                                        size="sm"
                                        style={{ borderRadius: '6px' }}
                                    >
                                        Enable
                                    </MDBBtn>
                                </div>

                                <div style={{
                                    padding: '16px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    background: '#f8fafc',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                                            Connected Accounts
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                                            Manage your connected social accounts
                                        </div>
                                    </div>
                                    <MDBBtn
                                        outline
                                        color="secondary"
                                        size="sm"
                                        style={{ borderRadius: '6px' }}
                                    >
                                        Manage
                                    </MDBBtn>
                                </div>
                            </div>
                        </MDBCardBody>
                    </MDBCard>
                </div>
            </div>
        </div>
    );
}
