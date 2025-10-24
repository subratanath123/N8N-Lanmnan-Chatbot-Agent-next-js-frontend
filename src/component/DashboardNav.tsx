"use client";

import React, { useState } from 'react';
import {
    MDBNavbar,
    MDBContainer,
    MDBNavbarBrand,
    MDBNavbarToggler,
    MDBIcon,
    MDBCollapse,
    MDBNavbarNav,
    MDBNavbarItem,
    MDBNavbarLink,
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
        <MDBNavbar expand='lg' light bgColor='light' className="dashboard-nav">
            <MDBContainer fluid className="dashboard-container">
                <MDBNavbarBrand href='/' className="dashboard-brand">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img 
                            src="/favicon.png" 
                            alt="Jade AI" 
                            style={{ width: '24px', height: '24px' }}
                        />
                        <span style={{ fontWeight: '600' }}>Jade AI</span>
                    </div>
                </MDBNavbarBrand>
                
                <MDBNavbarToggler
                    aria-controls='dashboardNavbar'
                    aria-expanded='false'
                    aria-label='Toggle navigation'
                    onClick={() => setShowNav(!showNav)}
                >
                    <MDBIcon icon='bars' fas/>
                </MDBNavbarToggler>
                
                <MDBCollapse navbar show={showNav}>
                    {/* Search Bar */}
                    <div className={`search-container ${showNav ? 'show' : 'hide'}`}>
                        <div className="search-input-wrapper">
                            <MDBIcon icon='search' className="search-icon-left" />
                            <input 
                                type="text" 
                                placeholder="Search For documents, templates and chatbots"
                                className="search-input"
                            />
                            <MDBIcon icon='microphone' className="search-icon-right" />
                        </div>
                    </div>
                    
                    <MDBNavbarNav className="ms-auto">
                        {/* Action Buttons */}
                        <MDBNavbarItem>
                            <button className="upgrade-btn">
                                Upgrade
                            </button>
                        </MDBNavbarItem>
                        
                        <MDBNavbarItem>
                            <MDBIcon icon='sun' className="action-icon" />
                        </MDBNavbarItem>
                        
                        <MDBNavbarItem>
                            <MDBIcon icon='bell' className="action-icon" />
                        </MDBNavbarItem>
                        
                        <MDBNavbarItem>
                            <MDBIcon icon='question-circle' className="action-icon" />
                        </MDBNavbarItem>
                        
                        <MDBNavbarItem>
                            <MDBDropdown>
                                <MDBDropdownToggle tag="a" className="nav-link dropdown-toggle" role="button">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: '#007bff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>
                                            {user.firstName ? user.firstName.charAt(0).toUpperCase() : 
                                             user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                                {user.firstName || 'User'}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#6c757d' }}>
                                                {user.emailAddresses[0]?.emailAddress || 'user@example.com'}
                                            </span>
                                        </div>
                                    </div>
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
                        </MDBNavbarItem>
                    </MDBNavbarNav>
                </MDBCollapse>
            </MDBContainer>
        </MDBNavbar>
    );
}
