"use client";

import React, { useState } from 'react';
import {
    MDBNavbar,
    MDBContainer,
    MDBNavbarBrand,
    MDBNavbarToggler,
    MDBIcon,
    MDBCollapse,
    MDBDropdown,
    MDBDropdownToggle,
    MDBDropdownMenu,
    MDBDropdownItem,
    MDBBadge
} from 'mdb-react-ui-kit';
import { useUser, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
import './dashboard.css';

export default function DashboardNav() {
    const [showNav, setShowNav] = useState(false);
    const { user, isSignedIn, isLoaded } = useUser();

    const getInitials = () => {
        if (!user) return 'U';
        if (user.firstName && user.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        if (user.firstName) {
            return user.firstName[0].toUpperCase();
        }
        return user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || 'U';
    };

    if (!isLoaded) {
        return (
            <MDBNavbar expand='lg' light bgColor='light' className="dashboard-nav">
                <MDBContainer fluid>
                    <MDBNavbarBrand href='#'>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                                src="/favicon.png" 
                                alt="Lanmnan" 
                                style={{ width: '24px', height: '24px' }}
                            />
                            <span>Lanmnan AI</span>
                        </div>
                    </MDBNavbarBrand>
                    <div style={{ padding: '8px 16px', color: '#6c757d' }}>
                        Loading...
                    </div>
                </MDBContainer>
            </MDBNavbar>
        );
    }

    if (!isSignedIn || !user) {
        return null;
    }

    return (
        <MDBNavbar expand='md' light bgColor='light' className="dashboard-nav">
            <MDBContainer fluid className="top-header-container py-2">
                <div className="top-header-wrapper">
                    <div className="top-brand align-items-center d-flex gap-3">
                        <MDBNavbarToggler
                            aria-label='Toggle navigation'
                            className="d-md-none border-0 shadow-0"
                            onClick={() => setShowNav(!showNav)}
                        >
                            <MDBIcon icon='bars' />
                        </MDBNavbarToggler>
                    </div>

                    <div className="top-search d-none d-md-flex">
                        <MDBIcon icon='search' className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search for documents, templates and chatbots..."
                            className="top-search-input"
                        />
                        <button type="button" className="mic-button" aria-label="Voice search">
                            <MDBIcon icon='microphone' />
                        </button>
                    </div>

                    <div className="top-actions d-none d-md-flex align-items-center gap-3">
                        <button type="button" className="upgrade-pill">
                            <span className="pill-icon">⚡</span>
                            Upgrade
                        </button>
                        <button type="button" className="icon-chip" aria-label="Toggle theme">
                            <MDBIcon icon='moon' />
                        </button>
                        <button type="button" className="icon-chip notification-chip" aria-label="Notifications">
                            <MDBIcon icon='bell' />
                            <span className="notification-dot"></span>
                        </button>
                        <button type="button" className="icon-chip" aria-label="Open shortcuts">
                            <MDBIcon icon='th-large' />
                        </button>
                        <button type="button" className="icon-chip" aria-label="Change language">
                            <MDBIcon icon='globe' />
                        </button>
                        <MDBDropdown className="profile-dropdown">
                            <MDBDropdownToggle tag="button" className="profile-chip" role="button">
                                <span className="profile-initials">{getInitials()}</span>
                            </MDBDropdownToggle>
                            <MDBDropdownMenu>
                                <MDBDropdownItem link href="/profile">
                                    <MDBIcon icon='user' className="me-2" />
                                    Profile
                                </MDBDropdownItem>
                                <MDBDropdownItem link href="/settings">
                                    <MDBIcon icon='cog' className="me-2" />
                                    Settings
                                </MDBDropdownItem>
                                <MDBDropdownItem link href="/billing">
                                    <MDBIcon icon='credit-card' className="me-2" />
                                    Billing
                                </MDBDropdownItem>
                                <MDBDropdownItem divider />
                                <MDBDropdownItem>
                                    <SignOutButton>
                                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                            <MDBIcon icon='sign-out-alt' className="me-2" />
                                            Sign Out
                                        </div>
                                    </SignOutButton>
                                </MDBDropdownItem>
                            </MDBDropdownMenu>
                        </MDBDropdown>
                    </div>
                </div>

            </MDBContainer>
        </MDBNavbar>
    );
}
