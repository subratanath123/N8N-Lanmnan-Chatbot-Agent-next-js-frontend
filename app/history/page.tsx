"use client";

import React from 'react';
import { useUser } from '@clerk/nextjs';
import PageLayout from '@/component/PageLayout';
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

  if (!isLoaded) {
    return (
      <PageLayout showNav={false}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <div>Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (!isSignedIn) {
    return (
      <PageLayout showNav={false}>
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
      </PageLayout>
    );
  }

  return (
    <PageLayout>
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
    </PageLayout>
  );
}
