"use client";

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import LeftSidebar from '@/component/LeftSidebar';
import {
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBCardTitle,
    MDBForm,
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
        <MDBContainer fluid className="py-4">
        <div className="mb-4">
          <h1 className="h2 mb-1">Settings</h1>
          <p className="text-muted">Manage your account preferences and AI settings.</p>
        </div>

        <MDBRow>
          <MDBCol lg="8">
            <MDBCard className="shadow-sm mb-4">
              <MDBCardBody>
                <MDBCardTitle className="d-flex align-items-center">
                  <MDBIcon icon="user" className="me-2" />
                  Profile Information
                </MDBCardTitle>
                <MDBForm>
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
                </MDBForm>
              </MDBCardBody>
            </MDBCard>

            <MDBCard className="shadow-sm mb-4">
              <MDBCardBody>
                <MDBCardTitle className="d-flex align-items-center">
                  <MDBIcon icon="cog" className="me-2" />
                  AI Preferences
                </MDBCardTitle>
                <MDBForm>
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
                    rows="3"
                    value="You are a helpful AI assistant."
                    className="mb-3"
                  />
                  <MDBBtn color="primary">
                    <MDBIcon icon="save" className="me-2" />
                    Save Settings
                  </MDBBtn>
                </MDBForm>
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
                  <MDBBtn color="outline-secondary">
                    <MDBIcon icon="key" className="me-2" />
                    Change Password
                  </MDBBtn>
                  <MDBBtn color="outline-secondary">
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
