"use client";

import React, { useState } from 'react';
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
    MDBBtn,
    MDBModal,
    MDBModalHeader,
    MDBModalTitle,
    MDBModalBody,
    MDBModalFooter,
    MDBInput,
    MDBTextArea,
    MDBBadge,
    MDBProgress,
    MDBTabs,
    MDBTabsContent,
    MDBTabsItem,
    MDBTabsLink,
    MDBTabsPane
} from 'mdb-react-ui-kit';

export default function ProjectsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [activeTab, setActiveTab] = useState('website');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
          <h2>Please sign in to view your projects</h2>
          <a href="/">
            <MDBBtn color="primary">Go to Home</MDBBtn>
          </a>
        </div>
      </PageLayout>
    );
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateProject = () => {
    // Handle project creation logic here
    const projectData = {
      name: newProjectName,
      url: newProjectUrl,
      files: uploadedFiles,
      type: activeTab
    };
    console.log('Creating project:', projectData);
    
    // Reset form
    setShowCreateModal(false);
    setNewProjectName('');
    setNewProjectUrl('');
    setUploadedFiles([]);
    setActiveTab('website');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <PageLayout>
      <MDBContainer fluid className="py-4">
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h2 mb-1">Website Training Projects</h1>
            <p className="text-muted">Train AI chatbots on your website content and get embeddable chat widgets.</p>
          </div>
          <MDBBtn color="primary" onClick={() => setShowCreateModal(true)}>
            <MDBIcon icon="plus" className="me-2" />
            Train New Website
          </MDBBtn>
        </div>

        {/* Quick Stats */}
        <MDBRow className="mb-4">
          <MDBCol md="6">
            <MDBCard className="text-center h-100">
              <MDBCardBody>
                <MDBIcon icon="globe" size="2x" className="text-primary mb-2" />
                <h5 className="text-primary">3</h5>
                <small className="text-muted">Active Projects</small>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
          <MDBCol md="6">
            <MDBCard className="text-center h-100">
              <MDBCardBody>
                <MDBIcon icon="thumbs-up" size="2x" className="text-warning mb-2" />
                <h5 className="text-warning">4.8</h5>
                <small className="text-muted">Avg. Rating</small>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>

        {/* Projects List */}
        <MDBRow>
          <MDBCol md="6" lg="4" className="mb-4">
            <MDBCard className="h-100 shadow-sm">
              <MDBCardBody>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center">
                    <MDBIcon icon="globe" size="2x" className="text-primary me-2" />
                    <div>
                      <MDBCardTitle className="mb-1">E-commerce Store</MDBCardTitle>
                      <small className="text-muted">store.example.com</small>
                    </div>
                  </div>
                  <MDBBadge color="success" className="mb-2">Live</MDBBadge>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted">Training Progress</small>
                    <small className="text-muted">100%</small>
                  </div>
                  <MDBProgress value={100} className="mb-2" />
                </div>

                <div className="mb-3">
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="h6 mb-0">247</div>
                      <small className="text-muted">Pages</small>
                    </div>
                    <div className="col-4">
                      <div className="h6 mb-0">1.2k</div>
                      <small className="text-muted">Conversations</small>
                    </div>
                    <div className="col-4">
                      <div className="h6 mb-0">4.9</div>
                      <small className="text-muted">Rating</small>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <MDBBtn color="primary" size="sm" className="flex-fill">
                    <MDBIcon icon="code" className="me-1" />
                    Embed Code
                  </MDBBtn>
                  <MDBBtn color="outline-secondary" size="sm">
                    <MDBIcon icon="cog" />
                  </MDBBtn>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>

          <MDBCol md="6" lg="4" className="mb-4">
            <MDBCard className="h-100 shadow-sm">
              <MDBCardBody>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center">
                    <MDBIcon icon="globe" size="2x" className="text-success me-2" />
                    <div>
                      <MDBCardTitle className="mb-1">Tech Blog</MDBCardTitle>
                      <small className="text-muted">blog.techcorp.com</small>
                    </div>
                  </div>
                  <MDBBadge color="warning" className="mb-2">Training</MDBBadge>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted">Training Progress</small>
                    <small className="text-muted">75%</small>
                  </div>
                  <MDBProgress value={75} className="mb-2" />
                </div>

                <div className="mb-3">
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="h6 mb-0">89</div>
                      <small className="text-muted">Pages</small>
                    </div>
                    <div className="col-4">
                      <div className="h6 mb-0">0</div>
                      <small className="text-muted">Conversations</small>
                    </div>
                    <div className="col-4">
                      <div className="h6 mb-0">-</div>
                      <small className="text-muted">Rating</small>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <MDBBtn color="outline-primary" size="sm" className="flex-fill" disabled>
                    <MDBIcon icon="clock" className="me-1" />
                    Training...
                  </MDBBtn>
                  <MDBBtn color="outline-secondary" size="sm">
                    <MDBIcon icon="cog" />
                  </MDBBtn>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>

          <MDBCol md="6" lg="4" className="mb-4">
            <MDBCard className="h-100 shadow-sm">
              <MDBCardBody>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center">
                    <MDBIcon icon="globe" size="2x" className="text-info me-2" />
                    <div>
                      <MDBCardTitle className="mb-1">Support Center</MDBCardTitle>
                      <small className="text-muted">help.company.com</small>
                    </div>
                  </div>
                  <MDBBadge color="success" className="mb-2">Live</MDBBadge>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted">Training Progress</small>
                    <small className="text-muted">100%</small>
                  </div>
                  <MDBProgress value={100} className="mb-2" />
                </div>

                <div className="mb-3">
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="h6 mb-0">156</div>
                      <small className="text-muted">Pages</small>
                    </div>
 <div className="col-4">
                      <div className="h6 mb-0">892</div>
                      <small className="text-muted">Conversations</small>
                    </div>
                    <div className="col-4">
                      <div className="h6 mb-0">4.7</div>
                      <small className="text-muted">Rating</small>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <MDBBtn color="primary" size="sm" className="flex-fill">
                    <MDBIcon icon="code" className="me-1" />
                    Embed Code
                  </MDBBtn>
                  <MDBBtn color="outline-secondary" size="sm">
                    <MDBIcon icon="cog" />
                  </MDBBtn>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>

        {/* Empty State */}
        <MDBRow>
          <MDBCol>
            <MDBCard className="shadow-sm">
              <MDBCardBody>
                <div className="text-center py-5">
                  <MDBIcon icon="robot" size="4x" className="text-muted mb-3" />
                  <h4>Ready to train your first website?</h4>
                  <p className="text-muted mb-4">
                    Upload your website content and create an intelligent chatbot that can answer questions about your business.
                  </p>
                  <MDBBtn color="primary" size="lg" onClick={() => setShowCreateModal(true)}>
                    <MDBIcon icon="plus" className="me-2" />
                    Start Training Website
                  </MDBBtn>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>

        {/* Create Project Modal */}
        <MDBModal show={showCreateModal} setShow={setShowCreateModal} tabIndex='-1' size="lg">
          <MDBModalHeader>
            <MDBModalTitle>Train New AI Assistant</MDBModalTitle>
          </MDBModalHeader>
          <MDBModalBody>
            <MDBInput
              label="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="mb-3"
              required
            />
            
            <MDBTabs className="mb-3">
              <MDBTabsItem>
                <MDBTabsLink 
                  onClick={() => setActiveTab('website')} 
                  active={activeTab === 'website'}
                >
                  <MDBIcon icon="globe" className="me-2" />
                  Website
                </MDBTabsLink>
              </MDBTabsItem>
              <MDBTabsItem>
                <MDBTabsLink 
                  onClick={() => setActiveTab('files')} 
                  active={activeTab === 'files'}
                >
                  <MDBIcon icon="file-upload" className="me-2" />
                  Files & Documents
                </MDBTabsLink>
              </MDBTabsItem>
            </MDBTabs>

            <MDBTabsContent>
              <MDBTabsPane show={activeTab === 'website'}>
                <MDBInput
                  label="Website URL"
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="mb-3"
                  required
                />
                <div className="alert alert-info">
                  <MDBIcon icon="info-circle" className="me-2" />
                  We'll crawl your website and train an AI chatbot on your content. This process usually takes 5-10 minutes.
                </div>
              </MDBTabsPane>

              <MDBTabsPane show={activeTab === 'files'}>
                <div className="mb-3">
                  <label className="form-label">Upload Documents</label>
                  <div 
                    className="border border-2 border-dashed rounded p-4 text-center"
                    style={{ 
                      borderColor: '#dee2e6',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer'
                    }}
                    onClick={() => document.getElementById('fileUpload')?.click()}
                  >
                    <MDBIcon icon="cloud-upload-alt" size="3x" className="text-muted mb-2" />
                    <p className="mb-2">Click to upload or drag and drop</p>
                    <p className="text-muted small mb-0">
                      PDF, DOC, DOCX, TXT files (Max 10MB each)
                    </p>
                    <input
                      id="fileUpload"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mb-3">
                    <h6>Uploaded Files:</h6>
                    <div className="list-group">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <MDBIcon 
                              icon={file.type.includes('pdf') ? 'file-pdf' : 'file-alt'} 
                              className="me-2 text-danger" 
                            />
                            <div>
                              <div className="fw-bold">{file.name}</div>
                              <small className="text-muted">{formatFileSize(file.size)}</small>
                            </div>
                          </div>
                          <MDBBtn 
                            color="link" 
                            size="sm" 
                            onClick={() => removeFile(index)}
                            className="text-danger"
                          >
                            <MDBIcon icon="times" />
                          </MDBBtn>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="alert alert-info">
                  <MDBIcon icon="info-circle" className="me-2" />
                  Upload your documents and we'll train an AI assistant on their content. Supported formats: PDF, DOC, DOCX, TXT.
                </div>
              </MDBTabsPane>
            </MDBTabsContent>

            <MDBTextArea
              label="Description (Optional)"
              rows="2"
              className="mb-3"
              placeholder="Brief description of your AI assistant's purpose..."
            />
          </MDBModalBody>
          <MDBModalFooter>
            <MDBBtn color="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </MDBBtn>
            <MDBBtn 
              color="primary" 
              onClick={handleCreateProject}
              disabled={!newProjectName || (activeTab === 'website' && !newProjectUrl) || (activeTab === 'files' && uploadedFiles.length === 0)}
            >
              <MDBIcon icon="robot" className="me-2" />
              Start Training
            </MDBBtn>
          </MDBModalFooter>
        </MDBModal>
      </MDBContainer>
    </PageLayout>
  );
}
