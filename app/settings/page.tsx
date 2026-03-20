"use client";

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import LeftSidebar from '@/component/LeftSidebar';
import PageHeader from '@/component/PageHeader';
import {
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBCardTitle,
    MDBInput,
    MDBBtn,
    MDBIcon
} from 'mdb-react-ui-kit';

export default function SettingsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleDrawerStateChange = (isOpen: boolean, activeItem: string, collapsed?: boolean) => {
    if (collapsed !== undefined) {
      setSidebarCollapsed(collapsed);
    }
  };

  const handleNavItemClick = (itemName: string, itemHref: string) => {
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
          }}>
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2>Please sign in to access settings</h2>
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
          breadcrumb={["Home", "Settings"]}
          title="Settings"
          subtitle="Manage your account preferences and AI settings."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          }
        />
        <MDBContainer fluid className="py-4">

        <MDBRow>
          <MDBCol lg="8">
            <MDBCard className="shadow-sm mb-4">
              <MDBCardBody>
                <MDBCardTitle className="d-flex align-items-center">
                  <MDBIcon icon="user" className="me-2" />
                  Profile Information
                </MDBCardTitle>
                <form>
                  <MDBRow>
                    <MDBCol md="6">
                      <MDBInput 
                        label="First Name" 
                        value={user?.firstName || ''} 
                        readOnly 
                        className="mb-3"
                      />
                    </MDBCol>
                    <MDBCol md="6">
                      <MDBInput 
                        label="Last Name" 
                        value={user?.lastName || ''} 
                        readOnly 
                        className="mb-3"
                      />
                    </MDBCol>
                  </MDBRow>
                  <MDBInput 
                    label="Email" 
                    value={user?.emailAddresses[0]?.emailAddress || ''} 
                    readOnly 
                    className="mb-3"
                  />
                  <MDBBtn color="primary">
                    <MDBIcon icon="edit" className="me-2" />
                    Edit Profile
                  </MDBBtn>
                </form>
              </MDBCardBody>
            </MDBCard>

            <MDBCard className="shadow-sm mb-4">
              <MDBCardBody>
                <MDBCardTitle className="d-flex align-items-center">
                  <MDBIcon icon="cog" className="me-2" />
                  AI Preferences
                </MDBCardTitle>
                <form>
                  <MDBInput 
                    label="Default Model" 
                    value="GPT-4" 
                    className="mb-3"
                  />
                  <MDBInput 
                    label="Temperature" 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    defaultValue="0.7"
                    className="mb-3"
                  />
                  <MDBInput 
                    label="System Prompt" 
                    type="textarea" 
                    value="You are a helpful AI assistant."
                    className="mb-3"
                  />
                  <MDBBtn color="primary">
                    <MDBIcon icon="save" className="me-2" />
                    Save Settings
                  </MDBBtn>
                </form>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>

          <MDBCol lg="4">
            <MDBCard className="shadow-sm mb-4">
              <MDBCardBody>
                <MDBCardTitle className="d-flex align-items-center">
                  <MDBIcon icon="shield-alt" className="me-2" />
                  Security
                </MDBCardTitle>
                <div className="d-grid gap-2">
                  <MDBBtn color="secondary" outline>
                    <MDBIcon icon="key" className="me-2" />
                    Change Password
                  </MDBBtn>
                  <MDBBtn color="secondary" outline>
                    <MDBIcon icon="mobile-alt" className="me-2" />
                    Two-Factor Auth
                  </MDBBtn>
                </div>
              </MDBCardBody>
            </MDBCard>

            <MDBCard className="shadow-sm">
              <MDBCardBody>
                <MDBCardTitle className="d-flex align-items-center">
                  <MDBIcon icon="trash" className="me-2" />
                  Danger Zone
                </MDBCardTitle>
                <p className="text-muted small mb-3">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <MDBBtn color="danger" size="sm">
                  <MDBIcon icon="trash" className="me-2" />
                  Delete Account
                </MDBBtn>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
      </div>
      
      <style jsx>{`
        .full-height-layout {
          display: flex;
          width: 100%;
          height: 100vh;
          position: relative;
          background-color: #F8F9FA;
        }
        
        .main-content {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          min-height: 100vh;
          background-color: #ffffff;
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
            margin-left: 0;
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
