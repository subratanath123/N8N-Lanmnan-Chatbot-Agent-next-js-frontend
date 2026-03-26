'use client';

import React, { useState } from 'react';
import { useUser, UserProfile } from '@clerk/nextjs';
import LeftSidebar from '@/component/LeftSidebar';
import PageHeader from '@/component/PageHeader';
import { MDBBtn } from 'mdb-react-ui-kit';

const clerkAppearance = {
  variables: {
    colorPrimary: '#2563eb',
    borderRadius: '10px',
  },
  elements: {
    rootBox: {
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'stretch',
    },
    card: {
      width: '100%',
      maxWidth: '960px',
      margin: '0 auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    },
    navbar: {
      borderRight: '1px solid #e2e8f0',
    },
    navbarMobileMenuRow: {
      width: '100%',
    },
  },
} as const;

export default function AccountPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleDrawerStateChange = (_isOpen: boolean, _activeItem: string, collapsed?: boolean) => {
    if (collapsed !== undefined) {
      setSidebarCollapsed(collapsed);
    }
  };

  const handleNavItemClick = (_itemName: string, itemHref: string) => {
    if (itemHref && itemHref !== '#' && itemHref.startsWith('/')) {
      window.location.href = itemHref;
    }
  };

  if (!isLoaded) {
    return (
      <div className="full-height-layout">
        <LeftSidebar
          onDrawerStateChange={handleDrawerStateChange}
          onNavItemClick={handleNavItemClick}
        />
        <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
            }}
          >
            <div>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="full-height-layout">
        <LeftSidebar
          onDrawerStateChange={handleDrawerStateChange}
          onNavItemClick={handleNavItemClick}
        />
        <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h2>Please sign in to view your account</h2>
            <a href="/">
              <MDBBtn color="primary">Go to Home</MDBBtn>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="full-height-layout">
      <LeftSidebar
        onDrawerStateChange={handleDrawerStateChange}
        onNavItemClick={handleNavItemClick}
      />
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <PageHeader
          title="My Account"
          subtitle="Profile, security, sessions, and connected accounts"
          icon="user-circle"
          breadcrumb={['Account']}
        />

        <div style={{ flex: 1, padding: '24px', width: '100%', minWidth: 0, background: '#f8f9fa' }}>
          <UserProfile routing="hash" appearance={clerkAppearance} />
        </div>
      </div>
    </div>
  );
}
