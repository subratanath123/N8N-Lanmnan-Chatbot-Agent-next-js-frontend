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
    MDBCardText,
    MDBIcon,
    MDBBtn
} from 'mdb-react-ui-kit';

export default function HistoryPage() {
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
            <h2>Please sign in to view your chat history</h2>
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
          <h1 className="h2 mb-1">Chat History</h1>
          <p className="text-muted">View and manage your previous conversations.</p>
        </div>

        <MDBRow>
          <MDBCol>
            <MDBCard className="shadow-sm">
              <MDBCardBody>
                <div className="text-center py-5">
                  <MDBIcon icon="history" size="4x" className="text-muted mb-3" />
                  <h4>No chat history yet</h4>
                  <p className="text-muted mb-4">
                    Start a conversation to see your chat history here.
                  </p>
                  <a href="/">
                    <MDBBtn color="primary">
                      <MDBIcon icon="plus" className="me-2" />
                      Start New Chat
                    </MDBBtn>
                  </a>
                </div>
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
