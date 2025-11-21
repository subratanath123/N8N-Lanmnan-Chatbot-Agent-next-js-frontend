"use client";

import React, { useState } from 'react';
import {
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBCard,
    MDBCardBody,
    MDBCardTitle,
    MDBInput,
    MDBTextArea,
    MDBBtn,
    MDBIcon,
    MDBSwitch,
    MDBProgress
} from 'mdb-react-ui-kit';
import { useAuth, useUser } from '@clerk/nextjs';

interface ChatbotCreationFormProps {
    onCancel: () => void;
    onSubmit: (chatbotData: ChatbotFormData) => void;
}

interface ChatbotFormData {
    title: string;
    name: string;
    hideName: boolean;
    instructions: string;
    restrictToDataSource: boolean;
    customFallbackMessage: boolean;
    fallbackMessage: string;
    greetingMessage: string;
}

interface UploadedFileInfo {
    id: string;
    name: string;
    size: number;
    fileId: string | null;
    isUploading: boolean;
    uploadError: string | null;
}

export default function ChatbotCreationForm({ onCancel, onSubmit }: ChatbotCreationFormProps) {
    const { isSignedIn } = useUser();
    const { getToken } = useAuth();
    
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;
    const [selectedDataSource, setSelectedDataSource] = useState<string>('');
    const [qaPairs, setQaPairs] = useState<Array<{id: string, question: string, answer: string}>>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [textContent, setTextContent] = useState('');
    const [addedWebsites, setAddedWebsites] = useState<string[]>([]);
    const [addedTexts, setAddedTexts] = useState<string[]>([]);
    const [formData, setFormData] = useState<ChatbotFormData>({
        title: 'JadeAIBot',
        name: 'JadeAIBot',
        hideName: false,
        instructions: 'You are a helpful AI assistant that can provide information and assistance to users. You should be friendly, professional, and helpful in all interactions.',
        restrictToDataSource: false,
        customFallbackMessage: false,
        fallbackMessage: 'I apologize, but I don\'t have enough information to answer that question. Please try rephrasing your question or contact support for assistance.',
        greetingMessage: 'Hey, what can I do for you today?'
    });

    const [errors, setErrors] = useState<Partial<ChatbotFormData>>({});

    const validateStep = (step: number): boolean => {
        const newErrors: Partial<ChatbotFormData> = {};

        if (step === 1) {
            if (!formData.title.trim()) {
                newErrors.title = 'Chatbot title is required';
            }
            if (!formData.name.trim()) {
                newErrors.name = 'Chatbot name is required';
            }
            if (!formData.instructions.trim()) {
                newErrors.instructions = 'Chatbot instructions are required';
            }
        }

        if (step === 2) {
            if (!formData.greetingMessage.trim()) {
                newErrors.greetingMessage = 'Greeting message is required';
            }
        }

        if (step === 3) {
            // Check if at least one training source is provided
            let hasTrainingData = false;
            
            if (selectedDataSource === 'url' && addedWebsites.length > 0) {
                hasTrainingData = true;
            } else if (selectedDataSource === 'pdf' && uploadedFiles.length > 0) {
                // Check if all files have been successfully uploaded
                const allFilesUploaded = uploadedFiles.every(file => file.fileId !== null && !file.isUploading);
                if (allFilesUploaded && uploadedFiles.length > 0) {
                    hasTrainingData = true;
                } else if (uploadedFiles.some(file => file.isUploading)) {
                    newErrors.instructions = 'Please wait for all files to finish uploading';
                } else if (uploadedFiles.some(file => file.uploadError)) {
                    newErrors.instructions = 'Some files failed to upload. Please remove failed files and try again';
                }
            } else if (selectedDataSource === 'text' && addedTexts.length > 0) {
                hasTrainingData = true;
            } else if (selectedDataSource === 'qa' && qaPairs.length > 0) {
                hasTrainingData = true;
            }
            
            if (!hasTrainingData && !newErrors.instructions) {
                newErrors.instructions = 'Please add at least one training source (URL, PDF, Text, or Q&A)';
            }
        }

        // Step 4 - Embed configuration (optional for now)  
        // Step 5 - Channels configuration (optional for now)
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(Math.min(currentStep + 1, totalSteps));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(Math.max(currentStep - 1, 1));
    };

    const handleStepClick = (step: number) => {
        // Allow navigation to previous steps or current step
        if (step <= currentStep) {
            setCurrentStep(step);
        }
    };

    const handleSubmit = () => {
        if (validateStep(currentStep)) {
            // Extract fileIds from uploaded files
            const fileIds = uploadedFiles
                .filter(file => file.fileId !== null)
                .map(file => file.fileId as string);
            
            const submissionData = {
                ...formData,
                qaPairs: qaPairs,
                selectedDataSource: selectedDataSource,
                fileIds: fileIds,
                uploadedFiles: [], // Keep for backward compatibility but empty
                addedWebsites: addedWebsites,
                addedTexts: addedTexts
            };
            onSubmit(submissionData);
        }
    };

    const handleInputChange = (field: keyof ChatbotFormData, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const handleAddQA = () => {
        if (currentQuestion.trim() && currentAnswer.trim()) {
            const newQA = {
                id: Date.now().toString(),
                question: currentQuestion.trim(),
                answer: currentAnswer.trim()
            };
            setQaPairs(prev => [...prev, newQA]);
            setCurrentQuestion('');
            setCurrentAnswer('');
            // Clear validation error if exists
            if (errors.instructions) {
                setErrors(prev => ({ ...prev, instructions: undefined }));
            }
        }
    };

    const handleRemoveQA = (id: string) => {
        setQaPairs(prev => prev.filter(qa => qa.id !== id));
    };

    const uploadFile = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        // Use placeholder values for chatbot creation context
        formData.append('workflowId', 'chatbot-creation');
        formData.append('webhookUrl', 'chatbot-creation');

        const headers: Record<string, string> = {};
        
        // Add bearer token if user is signed in
        if (isSignedIn) {
            try {
                const token = await getToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            } catch (error) {
                console.warn('Failed to get auth token:', error);
            }
        }
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const response = await fetch(`${backendUrl}/v1/api/file/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.errorMessage || `Failed to upload file: ${response.status}`);
        }

        const result = await response.json();

        if (!result.fileId) {
            throw new Error(result.errorMessage || 'File upload failed');
        }

        return result.fileId;
    };

    const handleFileSelect = async (files: FileList | null) => {
        if (files) {
            const newFiles = Array.from(files).filter(file => {
                // Check file type and size
                const isValidType = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                const isValidSize = file.size <= 30 * 1024 * 1024; // 30MB
                
                if (!isValidType) {
                    alert(`${file.name} is not a PDF file. Please select only PDF files.`);
                    return false;
                }
                if (!isValidSize) {
                    alert(`${file.name} is too large. Please select files smaller than 30MB.`);
                    return false;
                }
                return true;
            });

            // Check total file count
            const currentCount = uploadedFiles.length;
            if (currentCount + newFiles.length > 10) {
                alert('Maximum 10 files allowed. Some files were not added.');
                newFiles.splice(10 - currentCount);
            }

            // Add files to state with uploading status
            const newFileInfos: UploadedFileInfo[] = newFiles.map((file, index) => ({
                id: `${Date.now()}-${index}`,
                name: file.name,
                size: file.size,
                fileId: null,
                isUploading: true,
                uploadError: null,
            }));

            setUploadedFiles(prev => [...prev, ...newFileInfos]);
            
            // Clear validation error if exists
            if (errors.instructions && newFiles.length > 0) {
                setErrors(prev => ({ ...prev, instructions: undefined }));
            }

            // Upload files asynchronously
            newFiles.forEach(async (file, index) => {
                const fileInfoId = newFileInfos[index].id;
                try {
                    const fileId = await uploadFile(file);
                    setUploadedFiles(prev =>
                        prev.map(f =>
                            f.id === fileInfoId
                                ? { ...f, fileId, isUploading: false, uploadError: null }
                                : f
                        )
                    );
                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error);
                    setUploadedFiles(prev =>
                        prev.map(f =>
                            f.id === fileInfoId
                                ? {
                                      ...f,
                                      isUploading: false,
                                      uploadError: error instanceof Error ? error.message : 'Upload failed',
                                  }
                                : f
                        )
                    );
                    alert(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            });
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const removeFile = (id: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleAddWebsite = () => {
        if (websiteUrl.trim()) {
            setAddedWebsites(prev => [...prev, websiteUrl.trim()]);
            setWebsiteUrl('');
            // Clear validation error if exists
            if (errors.instructions) {
                setErrors(prev => ({ ...prev, instructions: undefined }));
            }
        } else {
            alert('Please enter a valid website URL');
        }
    };

    const handleAddText = () => {
        if (textContent.trim()) {
            setAddedTexts(prev => [...prev, textContent.trim()]);
            setTextContent('');
            // Clear validation error if exists
            if (errors.instructions) {
                setErrors(prev => ({ ...prev, instructions: undefined }));
            }
        } else {
            alert('Please enter some text content');
        }
    };

    const handleRemoveWebsite = (index: number) => {
        setAddedWebsites(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveText = (index: number) => {
        setAddedTexts(prev => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const renderStep1 = () => (
        <div style={{
            padding: '24px',
            background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.02) 0%, rgba(34, 197, 94, 0.02) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.1)'
        }}>
            <h4 className="mb-4" style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '700',
                fontSize: '24px'
            }}>Basic Configuration</h4>
            
            {/* Chatbot Title */}
            <div className="mb-4">
                <MDBInput
                    label="Chatbot Title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={errors.title ? 'is-invalid' : ''}
                    required
                />
                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                <small className="text-muted">This will be displayed as the main title of your chatbot</small>
            </div>

            {/* AI Chatbot Name */}
            <div className="mb-4">
                <MDBInput
                    label="AI Chatbot Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'is-invalid' : ''}
                    required
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                
                {/* Hide Chatbot Name Toggle */}
                <div className="mt-3">
                    <MDBSwitch
                        id="hideName"
                        label="Hide Chatbot Name"
                        checked={formData.hideName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('hideName', e.target.checked)}
                    />
                </div>
            </div>

            {/* Chatbot Instructions */}
            <div className="mb-4">
                <label className="form-label">Chatbot Instructions</label>
                <MDBTextArea
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    className={errors.instructions ? 'is-invalid' : ''}
                    rows={6}
                    required
                />
                {errors.instructions && <div className="invalid-feedback">{errors.instructions}</div>}
                <small className="text-muted">
                    It allows you to make your chatbot specific to your data and use case
                </small>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div style={{
            padding: '24px',
            background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.02) 0%, rgba(34, 197, 94, 0.02) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.1)'
        }}>
            <h4 className="mb-4" style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '700',
                fontSize: '24px'
            }}>Behavior Configuration</h4>
            
            {/* Restrict to Data Source */}
            <div className="mb-4">
                <MDBSwitch
                    id="restrictToDataSource"
                    label="Restrict to data source and instructions"
                    checked={formData.restrictToDataSource}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('restrictToDataSource', e.target.checked)}
                />
                <small className="text-muted d-block mt-2">
                    When enabled, the AI will only answer using connected data sources and the specified instructions
                </small>
            </div>

            {/* Custom Fallback Message */}
            <div className="mb-4">
                <MDBSwitch
                    id="customFallbackMessage"
                    label="Custom Fallback Message"
                    checked={formData.customFallbackMessage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('customFallbackMessage', e.target.checked)}
                />
                <small className="text-muted d-block mt-2">
                    Set what the chatbot should say when it does not know the answer
                </small>
            </div>

            {formData.customFallbackMessage && (
                <div className="mb-4">
                    <MDBTextArea
                        label="Fallback Message"
                        value={formData.fallbackMessage}
                        onChange={(e) => handleInputChange('fallbackMessage', e.target.value)}
                        rows={3}
                    />
                </div>
            )}

            {/* Greeting Message */}
            <div className="mb-4">
                <MDBInput
                    label="Greeting Message"
                    value={formData.greetingMessage}
                    onChange={(e) => handleInputChange('greetingMessage', e.target.value)}
                    className={errors.greetingMessage ? 'is-invalid' : ''}
                    required
                />
                {errors.greetingMessage && <div className="invalid-feedback">{errors.greetingMessage}</div>}
                <small className="text-muted">This message will be shown when users first interact with your chatbot</small>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div style={{
            padding: '24px',
            background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.02) 0%, rgba(34, 197, 94, 0.02) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.1)'
        }}>
            <h4 className="mb-4" style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '700',
                fontSize: '24px'
            }}>Add a Knowledge Base</h4>
            <p className="text-muted mb-4">Your chatbot will answer based on the added knowledge to personalize chatbot experience.</p>
            
            {/* Display error message if validation fails */}
            {errors.instructions && <div className="alert alert-warning mb-3">{errors.instructions}</div>}
            
            <div className="mb-4">
                <h6 style={{ 
                    color: '#1e293b',
                    fontWeight: '600',
                    marginBottom: '20px',
                    fontSize: '16px'
                }}>Select a data source</h6>
                <div className="row g-3">
                    <div className="col-md-4">
                        <div 
                            className="rounded text-center"
                            style={{ 
                                cursor: 'pointer', 
                                position: 'relative',
                                padding: '24px',
                                border: selectedDataSource === 'url' 
                                    ? '2px solid #3b82f6' 
                                    : '2px solid #e2e8f0',
                                background: selectedDataSource === 'url'
                                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                                    : 'white',
                                transition: 'all 0.3s ease',
                                boxShadow: selectedDataSource === 'url'
                                    ? '0 8px 24px rgba(59, 130, 246, 0.15)'
                                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
                                transform: selectedDataSource === 'url' ? 'translateY(-4px)' : 'translateY(0)'
                            }}
                            onClick={() => setSelectedDataSource('url')}
                            onMouseEnter={(e) => {
                                if (selectedDataSource !== 'url') {
                                    e.currentTarget.style.borderColor = '#93c5fd';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedDataSource !== 'url') {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                                }
                            }}
                        >
                            {selectedDataSource === 'url' && (
                                <div className="position-absolute top-2 end-2">
                                    <MDBIcon icon="check-circle" style={{ color: '#3b82f6' }} size="lg" />
                                </div>
                            )}
                            <MDBIcon icon="link" size="2x" style={{ color: '#3b82f6', marginBottom: '12px' }} />
                            <h6 style={{ color: '#1e293b', fontWeight: '600', margin: 0 }}>URL</h6>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div 
                            className="rounded text-center"
                            style={{ 
                                cursor: 'pointer', 
                                position: 'relative',
                                padding: '24px',
                                border: selectedDataSource === 'pdf' 
                                    ? '2px solid #3b82f6' 
                                    : '2px solid #e2e8f0',
                                background: selectedDataSource === 'pdf'
                                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                                    : 'white',
                                transition: 'all 0.3s ease',
                                boxShadow: selectedDataSource === 'pdf'
                                    ? '0 8px 24px rgba(59, 130, 246, 0.15)'
                                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
                                transform: selectedDataSource === 'pdf' ? 'translateY(-4px)' : 'translateY(0)'
                            }}
                            onClick={() => setSelectedDataSource('pdf')}
                            onMouseEnter={(e) => {
                                if (selectedDataSource !== 'pdf') {
                                    e.currentTarget.style.borderColor = '#93c5fd';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedDataSource !== 'pdf') {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                                }
                            }}
                        >
                            {selectedDataSource === 'pdf' && (
                                <div className="position-absolute top-2 end-2">
                                    <MDBIcon icon="check-circle" style={{ color: '#3b82f6' }} size="lg" />
                                </div>
                            )}
                            <MDBIcon icon="file-pdf" size="2x" style={{ color: '#ef4444', marginBottom: '12px' }} />
                            <h6 style={{ color: '#1e293b', fontWeight: '600', margin: 0 }}>PDF</h6>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div 
                            className="rounded text-center"
                            style={{ 
                                cursor: 'pointer', 
                                position: 'relative',
                                padding: '24px',
                                border: selectedDataSource === 'text' 
                                    ? '2px solid #22c55e' 
                                    : '2px solid #e2e8f0',
                                background: selectedDataSource === 'text'
                                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
                                    : 'white',
                                transition: 'all 0.3s ease',
                                boxShadow: selectedDataSource === 'text'
                                    ? '0 8px 24px rgba(34, 197, 94, 0.15)'
                                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
                                transform: selectedDataSource === 'text' ? 'translateY(-4px)' : 'translateY(0)'
                            }}
                            onClick={() => setSelectedDataSource('text')}
                            onMouseEnter={(e) => {
                                if (selectedDataSource !== 'text') {
                                    e.currentTarget.style.borderColor = '#86efac';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedDataSource !== 'text') {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                                }
                            }}
                        >
                            {selectedDataSource === 'text' && (
                                <div className="position-absolute top-2 end-2">
                                    <MDBIcon icon="check-circle" style={{ color: '#22c55e' }} size="lg" />
                                </div>
                            )}
                            <MDBIcon icon="file-alt" size="2x" style={{ color: '#22c55e', marginBottom: '12px' }} />
                            <h6 style={{ color: '#1e293b', fontWeight: '600', margin: 0 }}>Text</h6>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div 
                            className="rounded text-center"
                            style={{ 
                                cursor: 'pointer', 
                                position: 'relative',
                                padding: '24px',
                                border: selectedDataSource === 'qa' 
                                    ? '2px solid #22c55e' 
                                    : '2px solid #e2e8f0',
                                background: selectedDataSource === 'qa'
                                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
                                    : 'white',
                                transition: 'all 0.3s ease',
                                boxShadow: selectedDataSource === 'qa'
                                    ? '0 8px 24px rgba(34, 197, 94, 0.15)'
                                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
                                transform: selectedDataSource === 'qa' ? 'translateY(-4px)' : 'translateY(0)'
                            }}
                            onClick={() => setSelectedDataSource('qa')}
                            onMouseEnter={(e) => {
                                if (selectedDataSource !== 'qa') {
                                    e.currentTarget.style.borderColor = '#86efac';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedDataSource !== 'qa') {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                                }
                            }}
                        >
                            {selectedDataSource === 'qa' && (
                                <div className="position-absolute top-2 end-2">
                                    <MDBIcon icon="check-circle" style={{ color: '#22c55e' }} size="lg" />
                                </div>
                            )}
                            <MDBIcon icon="question-circle" size="2x" style={{ color: '#f59e0b', marginBottom: '12px' }} />
                            <h6 style={{ color: '#1e293b', fontWeight: '600', margin: 0 }}>Q&A</h6>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div 
                            className="rounded text-center border-secondary"
                            style={{ 
                                padding: '24px',
                                border: '2px solid #e2e8f0',
                                background: 'white',
                                opacity: 0.6
                            }}
                        >
                            <MDBIcon icon="play-circle" size="2x" style={{ color: '#ef4444', marginBottom: '12px' }} />
                            <h6 style={{ color: '#1e293b', fontWeight: '600', margin: 0 }}>YouTube</h6>
                            <small style={{ color: '#94a3b8' }}>Coming Soon</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conditional Content Based on Selection */}
            {selectedDataSource === 'url' && (
                <div className="mb-4">
                    <h6>Enter Website URL</h6>
                    <div className="mb-3">
                        <MDBInput 
                            label="Website URL" 
                            placeholder="https://example.com"
                            type="url"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                        />
                        <small className="text-muted">Enter the website URL to crawl and extract content for training</small>
                    </div>
                    <MDBBtn 
                        color="primary" 
                        onClick={handleAddWebsite}
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 24px',
                            fontWeight: '600',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.35)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <MDBIcon icon="plus" className="me-1" />
                        Add Website
                    </MDBBtn>
                    
                    {/* Display Added Websites */}
                    {addedWebsites.length > 0 && (
                        <div className="mt-4">
                            <h6>Added Websites ({addedWebsites.length})</h6>
                            <div className="list-group">
                                {addedWebsites.map((website, index) => (
                                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            <MDBIcon icon="globe" className="me-2 text-primary" />
                                            <span className="text-truncate" style={{ maxWidth: '300px' }} title={website}>
                                                {website}
                                            </span>
                                        </div>
                                        <MDBBtn 
                                            color="danger" 
                                            size="sm" 
                                            onClick={() => handleRemoveWebsite(index)}
                                            style={{ padding: '4px 8px' }}
                                        >
                                            <MDBIcon icon="times" />
                                        </MDBBtn>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedDataSource === 'pdf' && (
                <div className="mb-4">
                    <h6>Upload PDF Files</h6>
                    <div 
                        className="rounded text-center"
                        style={{ 
                            border: isDragOver 
                                ? '3px dashed #3b82f6' 
                                : '2px dashed #cbd5e1',
                            padding: '48px 24px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: isDragOver
                                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%)'
                                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(34, 197, 94, 0.02) 100%)',
                            borderRadius: '16px'
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('pdf-file-input')?.click()}
                        onMouseEnter={(e) => {
                            if (!isDragOver) {
                                e.currentTarget.style.borderColor = '#93c5fd';
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(34, 197, 94, 0.05) 100%)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isDragOver) {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(34, 197, 94, 0.02) 100%)';
                            }
                        }}
                    >
                        <input
                            id="pdf-file-input"
                            type="file"
                            multiple
                            accept=".pdf"
                            onChange={handleFileInputChange}
                            style={{ display: 'none' }}
                        />
                        <MDBIcon icon="file-pdf" size="3x" className="text-danger mb-3" />
                        <p className="mb-3">
                            Drag and drop PDF files or <span className="text-primary">Browse</span>
                        </p>
                        <small className="text-muted">Maximum 10 files, 30MB each. Supported format: PDF</small>
                    </div>

                    {/* Display uploaded files */}
                    {uploadedFiles.length > 0 && (
                        <div className="mt-3">
                            <h6>Uploaded Files ({uploadedFiles.length}/10)</h6>
                            <div className="mt-2">
                                {uploadedFiles.map((fileInfo) => (
                                    <div key={fileInfo.id} className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-light">
                                        <div className="d-flex align-items-center flex-grow-1">
                                            <MDBIcon 
                                                icon="file-pdf" 
                                                className="text-danger me-2" 
                                            />
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="fw-medium">{fileInfo.name}</span>
                                                    {fileInfo.isUploading && (
                                                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                            <span className="visually-hidden">Uploading...</span>
                                                        </div>
                                                    )}
                                                    {fileInfo.fileId && !fileInfo.isUploading && (
                                                        <MDBIcon icon="check-circle" className="text-success" size="sm" />
                                                    )}
                                                    {fileInfo.uploadError && (
                                                        <MDBIcon icon="exclamation-circle" className="text-danger" size="sm" />
                                                    )}
                                                </div>
                                                <small className="text-muted">
                                                    {formatFileSize(fileInfo.size)}
                                                    {fileInfo.isUploading && ' - Uploading...'}
                                                    {fileInfo.fileId && !fileInfo.isUploading && ' - Uploaded'}
                                                    {fileInfo.uploadError && ` - Error: ${fileInfo.uploadError}`}
                                                </small>
                                            </div>
                                        </div>
                                        <MDBBtn 
                                            color="danger" 
                                            size="sm"
                                            onClick={() => removeFile(fileInfo.id)}
                                            disabled={fileInfo.isUploading}
                                        >
                                            <MDBIcon icon="trash" size="sm" />
                                        </MDBBtn>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-3">
                        <small className="text-muted d-block mb-2">
                            Files are automatically uploaded when selected. Uploaded files will be used for training.
                        </small>
                    </div>
                </div>
            )}

            {selectedDataSource === 'text' && (
                <div className="mb-4">
                    <h6>Add Text Content</h6>
                    <div className="mb-3">
                        <MDBTextArea 
                            label="Text Content"
                            rows={6}
                            placeholder="Enter your text content here..."
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                        />
                        <small className="text-muted">Add any specific text content, FAQs, or knowledge base information</small>
                    </div>
                    <MDBBtn 
                        color="primary" 
                        onClick={handleAddText}
                        style={{
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 24px',
                            fontWeight: '600',
                            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.35)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.25)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <MDBIcon icon="plus" className="me-1" />
                        Add Text
                    </MDBBtn>
                    
                    {/* Display Added Text Content */}
                    {addedTexts.length > 0 && (
                        <div className="mt-4">
                            <h6>Added Text Content ({addedTexts.length})</h6>
                            <div className="list-group">
                                {addedTexts.map((text, index) => (
                                    <div key={index} className="list-group-item d-flex justify-content-between align-items-start">
                                        <div className="d-flex align-items-start flex-grow-1">
                                            <MDBIcon icon="file-text" className="me-2 text-primary mt-1" />
                                            <div className="flex-grow-1">
                                                <div 
                                                    className="text-truncate" 
                                                    style={{ 
                                                        maxWidth: '400px',
                                                        maxHeight: '60px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical'
                                                    }} 
                                                    title={text}
                                                >
                                                    {text}
                                                </div>
                                            </div>
                                        </div>
                                        <MDBBtn 
                                            color="danger" 
                                            size="sm" 
                                            onClick={() => handleRemoveText(index)}
                                            style={{ padding: '4px 8px', marginLeft: '10px' }}
                                        >
                                            <MDBIcon icon="times" />
                                        </MDBBtn>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedDataSource === 'qa' && (
                <div className="mb-4">
                    <h6>Add Q&A Pairs</h6>
                    <div className="mb-3">
                        <MDBInput 
                            label="Question"
                            placeholder="Enter a question..."
                            value={currentQuestion}
                            onChange={(e) => setCurrentQuestion(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <MDBTextArea 
                            label="Answer"
                            rows={4}
                            placeholder="Enter the answer..."
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                        />
                    </div>
                    <MDBBtn 
                        color="primary"
                        onClick={handleAddQA}
                        disabled={!currentQuestion.trim() || !currentAnswer.trim()}
                        style={{
                            background: !currentQuestion.trim() || !currentAnswer.trim()
                                ? '#cbd5e1'
                                : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 24px',
                            fontWeight: '600',
                            boxShadow: !currentQuestion.trim() || !currentAnswer.trim()
                                ? 'none'
                                : '0 4px 12px rgba(34, 197, 94, 0.25)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (currentQuestion.trim() && currentAnswer.trim()) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.35)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentQuestion.trim() && currentAnswer.trim()) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.25)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        <MDBIcon icon="plus" className="me-1" />
                        Add Q&A
                    </MDBBtn>

                    {/* Display Added Q&A Pairs */}
                    {qaPairs.length > 0 && (
                        <div className="mt-4">
                            <h6>Added Q&A Pairs ({qaPairs.length})</h6>
                            <div className="mt-3">
                                {qaPairs.map((qa, index) => (
                                    <div key={qa.id} className="border rounded p-3 mb-3 bg-light">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="mb-1">Q&A #{index + 1}</h6>
                                            <MDBBtn 
                                                color="danger" 
                                                size="sm"
                                                onClick={() => handleRemoveQA(qa.id)}
                                            >
                                                <MDBIcon icon="trash" size="sm" />
                                            </MDBBtn>
                                        </div>
                                        <div className="mb-2">
                                            <strong>Q:</strong> {qa.question}
                                        </div>
                                        <div>
                                            <strong>A:</strong> {qa.answer}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderStep4 = () => (
        <div style={{
            padding: '24px',
            background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.02) 0%, rgba(34, 197, 94, 0.02) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.1)'
        }}>
            <h4 className="mb-4" style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '700',
                fontSize: '24px'
            }}>Embed Configuration</h4>
            
            <div className="mb-4">
                <h6>Embedding Options</h6>
                <div className="bg-light p-3 rounded">
                    <p className="text-muted">Choose how you want to embed your chatbot on websites and applications.</p>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <div className="border rounded p-3 mb-3">
                        <h6>Website Widget</h6>
                        <p className="text-muted small">Embed as a chat widget on your website</p>
                        <MDBBtn color="primary" outline size="sm">Get Embed Code</MDBBtn>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="border rounded p-3 mb-3">
                        <h6>API Integration</h6>
                        <p className="text-muted small">Use our API to integrate with your applications</p>
                        <MDBBtn color="primary" outline size="sm">Get API Key</MDBBtn>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div style={{
            padding: '24px',
            background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.02) 0%, rgba(34, 197, 94, 0.02) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.1)'
        }}>
            <h4 className="mb-4" style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '700',
                fontSize: '24px'
            }}>Channels & Deployment</h4>
            
            <div className="mb-4">
                <h6>Communication Channels</h6>
                <div className="row">
                    <div className="col-md-4">
                        <div className="border rounded p-3 text-center">
                            <MDBIcon icon="globe" size="2x" className="text-primary mb-2" />
                            <h6>Website</h6>
                            <p className="text-muted small">Deploy on your website</p>
                            <MDBSwitch id="website" label="Enable" />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="border rounded p-3 text-center">
                            <MDBIcon icon="facebook" size="2x" className="text-primary mb-2" />
                            <h6>Facebook Messenger</h6>
                            <p className="text-muted small">Connect to Facebook</p>
                            <MDBSwitch id="facebook" label="Enable" />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="border rounded p-3 text-center">
                            <MDBIcon icon="whatsapp" size="2x" className="text-success mb-2" />
                            <h6>WhatsApp</h6>
                            <p className="text-muted small">Connect to WhatsApp</p>
                            <MDBSwitch id="whatsapp" label="Enable" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <h6>Configuration Summary</h6>
                <div className="bg-light p-3 rounded">
                    <div className="row">
                        <div className="col-md-6">
                            <p><strong>Title:</strong> {formData.title}</p>
                            <p><strong>Name:</strong> {formData.hideName ? 'Hidden' : formData.name}</p>
                            <p><strong>Greeting:</strong> {formData.greetingMessage}</p>
                        </div>
                        <div className="col-md-6">
                            <p><strong>Restricted to Data:</strong> {formData.restrictToDataSource ? 'Yes' : 'No'}</p>
                            <p><strong>Custom Fallback:</strong> {formData.customFallbackMessage ? 'Yes' : 'No'}</p>
                            <p><strong>Status:</strong> Ready to Deploy</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const getProgressPercentage = () => {
        return (currentStep / totalSteps) * 100;
    };

    const stepLabels = [
        { number: 1, label: 'Configure' },
        { number: 2, label: 'Customize' },
        { number: 3, label: 'Train' },
        { number: 4, label: 'Embed' },
        { number: 5, label: 'Channels' }
    ];

    const renderStepNavigation = () => (
        <div className="d-flex justify-content-center mb-5" style={{ position: 'relative' }}>
            {/* Progress line */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '10%',
                right: '10%',
                height: '3px',
                background: 'linear-gradient(90deg, #3b82f6 0%, #22c55e 100%)',
                borderRadius: '2px',
                opacity: 0.2,
                zIndex: 0
            }}></div>
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '10%',
                width: `${((currentStep - 1) / (totalSteps - 1)) * 80}%`,
                height: '3px',
                background: 'linear-gradient(90deg, #3b82f6 0%, #22c55e 100%)',
                borderRadius: '2px',
                zIndex: 1,
                transition: 'width 0.5s ease'
            }}></div>
            
            <div className="d-flex align-items-center gap-4" style={{ position: 'relative', zIndex: 2 }}>
                {stepLabels.map((step, index) => {
                    const isActive = currentStep === step.number;
                    const isCompleted = currentStep > step.number;
                    const isPending = currentStep < step.number;
                    
                    return (
                        <div key={step.number} className="d-flex flex-column align-items-center">
                            <div
                                className="d-flex align-items-center justify-content-center rounded-circle"
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    border: isActive ? '3px solid #3b82f6' : isCompleted ? '3px solid #22c55e' : '3px solid #e2e8f0',
                                    background: isActive 
                                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                        : isCompleted
                                        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                        : 'white',
                                    color: isPending ? '#94a3b8' : 'white',
                                    cursor: currentStep >= step.number ? 'pointer' : 'default',
                                    transition: 'all 0.3s ease',
                                    boxShadow: isActive 
                                        ? '0 8px 20px rgba(59, 130, 246, 0.3)'
                                        : isCompleted
                                        ? '0 4px 12px rgba(34, 197, 94, 0.2)'
                                        : '0 2px 4px rgba(0, 0, 0, 0.05)',
                                    transform: isActive ? 'scale(1.1)' : 'scale(1)'
                                }}
                                onClick={() => handleStepClick(step.number)}
                                onMouseEnter={(e) => {
                                    if (currentStep >= step.number) {
                                        e.currentTarget.style.transform = 'scale(1.15)';
                                        e.currentTarget.style.boxShadow = isActive 
                                            ? '0 12px 28px rgba(59, 130, 246, 0.4)'
                                            : '0 8px 20px rgba(34, 197, 94, 0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = isActive ? 'scale(1.1)' : 'scale(1)';
                                    e.currentTarget.style.boxShadow = isActive 
                                        ? '0 8px 20px rgba(59, 130, 246, 0.3)'
                                        : isCompleted
                                        ? '0 4px 12px rgba(34, 197, 94, 0.2)'
                                        : '0 2px 4px rgba(0, 0, 0, 0.05)';
                                }}
                            >
                                {isCompleted ? (
                                    <MDBIcon icon="check" size="sm" />
                                ) : (
                                    <span className="fw-bold" style={{ fontSize: '16px' }}>{step.number}</span>
                                )}
                            </div>
                            <span
                                className="mt-3 small fw-semibold"
                                style={{
                                    color: isActive 
                                        ? '#3b82f6'
                                        : isCompleted
                                        ? '#22c55e'
                                        : '#94a3b8',
                                    fontSize: '13px',
                                    transition: 'all 0.3s ease',
                                    textAlign: 'center',
                                    minWidth: '80px'
                                }}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 50%, #ffffff 100%)',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorative gradient circles */}
            <div style={{
                position: 'absolute',
                top: '-100px',
                right: '-100px',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '-150px',
                left: '-150px',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
            }}></div>
            
            <MDBContainer style={{ position: 'relative', zIndex: 1 }}>
                <MDBRow className="justify-content-center">
                    <MDBCol md="10" lg="9">
                        <MDBCard className="shadow-lg" style={{
                            border: 'none',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            background: 'white',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)'
                        }}>
                            <MDBCardBody className="p-5" style={{
                                background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.02) 0%, rgba(34, 197, 94, 0.02) 100%)'
                            }}>
                                {/* Header */}
                                <div className="d-flex justify-content-between align-items-start mb-4" style={{
                                    padding: '24px',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(34, 197, 94, 0.05) 100%)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(59, 130, 246, 0.1)'
                                }}>
                                    <div className="flex-grow-1 me-4">
                                        <MDBCardTitle className="h4 mb-2" style={{
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            fontWeight: '700',
                                            fontSize: '28px'
                                        }}>
                                            Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1].label} Chatbot
                                        </MDBCardTitle>
                                        <p className="mb-0" style={{ 
                                            fontSize: '15px', 
                                            lineHeight: '1.6',
                                            color: '#64748b',
                                            marginTop: '8px'
                                        }}>
                                            {currentStep === 1 && "Create and configure an external chatbot that can interact with your users and provide various information on other 3rd party websites."}
                                            {currentStep === 2 && "Customize your chatbot's behavior and messaging to match your brand and requirements."}
                                            {currentStep === 3 && "Train your chatbot using website URLs, PDF documents, and custom text content to improve its knowledge base."}
                                            {currentStep === 4 && "Set up embedding options for integrating your chatbot into websites and applications."}
                                            {currentStep === 5 && "Configure communication channels and deploy your chatbot across multiple platforms."}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                    <MDBBtn
                                        color="secondary"
                                        outline
                                        size="sm"
                                        onClick={onCancel}
                                        style={{
                                            borderColor: '#cbd5e1',
                                            color: '#64748b',
                                            fontWeight: '500',
                                            borderRadius: '12px',
                                            padding: '10px 20px',
                                            transition: 'all 0.3s ease',
                                            background: 'white'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                                            e.currentTarget.style.borderColor = '#94a3b8';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'white';
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <MDBIcon icon="times" size="sm" className="me-1" />
                                        Cancel
                                    </MDBBtn>
                                    </div>
                                </div>

                                {/* Step Navigation */}
                                {renderStepNavigation()}

                                {/* Form Content */}
                                <div className="mb-4" style={{ minHeight: '400px' }}>
                                    {currentStep === 1 && renderStep1()}
                                    {currentStep === 2 && renderStep2()}
                                    {currentStep === 3 && renderStep3()}
                                    {currentStep === 4 && renderStep4()}
                                    {currentStep === 5 && renderStep5()}
                                </div>

                                {/* Navigation Buttons */}
                                <div className="d-flex justify-content-between align-items-center" style={{
                                    paddingTop: '32px',
                                    marginTop: '32px',
                                    borderTop: '2px solid rgba(59, 130, 246, 0.1)'
                                }}>
                                    <div>
                                        {currentStep > 1 && (
                                            <MDBBtn
                                                color="light"
                                                onClick={handlePrevious}
                                                style={{
                                                    border: '2px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    padding: '12px 24px',
                                                    fontWeight: '600',
                                                    color: '#64748b',
                                                    background: 'white',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                                    e.currentTarget.style.transform = 'translateX(-4px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'white';
                                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                }}
                                            >
                                                <MDBIcon icon="chevron-left" className="me-1" />
                                                Previous
                                            </MDBBtn>
                                        )}
                                    </div>
                                    <div>
                                        {currentStep < totalSteps ? (
                                            <MDBBtn
                                                color="primary"
                                                onClick={handleNext}
                                                style={{
                                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    padding: '12px 32px',
                                                    fontWeight: '600',
                                                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                Next
                                                <MDBIcon icon="chevron-right" className="ms-1" />
                                            </MDBBtn>
                                        ) : (
                                            <MDBBtn
                                                color="success"
                                                onClick={handleSubmit}
                                                style={{
                                                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    padding: '12px 32px',
                                                    fontWeight: '600',
                                                    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
                                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.4)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
                                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(34, 197, 94, 0.3)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <MDBIcon icon="check" className="me-1" />
                                                Create Chatbot
                                            </MDBBtn>
                                        )}
                                    </div>
                                </div>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                </MDBRow>
            </MDBContainer>
        </div>
    );
}
