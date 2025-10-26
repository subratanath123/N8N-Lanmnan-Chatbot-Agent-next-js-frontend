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

export default function ChatbotCreationForm({ onCancel, onSubmit }: ChatbotCreationFormProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;
    const [selectedDataSource, setSelectedDataSource] = useState<string>('');
    const [qaPairs, setQaPairs] = useState<Array<{id: string, question: string, answer: string}>>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [textContent, setTextContent] = useState('');
    const [addedWebsites, setAddedWebsites] = useState<string[]>([]);
    const [addedTexts, setAddedTexts] = useState<string[]>([]);
    const [formData, setFormData] = useState<ChatbotFormData>({
        title: 'DavinciBot',
        name: 'DavinciBot',
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
                hasTrainingData = true;
            } else if (selectedDataSource === 'text' && addedTexts.length > 0) {
                hasTrainingData = true;
            } else if (selectedDataSource === 'qa' && qaPairs.length > 0) {
                hasTrainingData = true;
            }
            
            if (!hasTrainingData) {
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
            const submissionData = {
                ...formData,
                qaPairs: qaPairs,
                selectedDataSource: selectedDataSource,
                uploadedFiles: uploadedFiles,
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

    const handleFileSelect = (files: FileList | null) => {
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

            setUploadedFiles(prev => {
                const combined = [...prev, ...newFiles];
                if (combined.length > 10) {
                    alert('Maximum 10 files allowed. Some files were not added.');
                    return combined.slice(0, 10);
                }
                return combined;
            });
            
            // Clear validation error if exists
            if (errors.instructions && newFiles.length > 0) {
                setErrors(prev => ({ ...prev, instructions: undefined }));
            }
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

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddWebsite = () => {
        if (websiteUrl.trim()) {
            setAddedWebsites(prev => [...prev, websiteUrl.trim()]);
            setWebsiteUrl('');
            alert(`Website "${websiteUrl}" has been added successfully!`);
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
            alert(`Text content has been added successfully!`);
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
        <div>
            <h4 className="mb-4">Basic Configuration</h4>
            
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
        <div>
            <h4 className="mb-4">Behavior Configuration</h4>
            
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
        <div>
            <h4 className="mb-4">Add a Knowledge Base</h4>
            <p className="text-muted mb-4">Your chatbot will answer based on the added knowledge to personalize chatbot experience.</p>
            
            {/* Display error message if validation fails */}
            {errors.instructions && <div className="alert alert-warning mb-3">{errors.instructions}</div>}
            
            <div className="mb-4">
                <h6>Select a data source</h6>
                <div className="row g-3">
                    <div className="col-md-4">
                        <div 
                            className={`border rounded p-3 text-center cursor-pointer ${
                                selectedDataSource === 'url' ? 'border-primary bg-light' : 'border-secondary'
                            }`}
                            style={{ cursor: 'pointer', position: 'relative' }}
                            onClick={() => setSelectedDataSource('url')}
                        >
                            {selectedDataSource === 'url' && (
                                <div className="position-absolute top-0 end-0 m-2">
                                    <MDBIcon icon="check-circle" className="text-primary" size="lg" />
                                </div>
                            )}
                            <MDBIcon icon="link" size="2x" className="text-primary mb-2" />
                            <h6>URL</h6>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div 
                            className={`border rounded p-3 text-center cursor-pointer ${
                                selectedDataSource === 'pdf' ? 'border-primary bg-light' : 'border-secondary'
                            }`}
                            style={{ cursor: 'pointer', position: 'relative' }}
                            onClick={() => setSelectedDataSource('pdf')}
                        >
                            {selectedDataSource === 'pdf' && (
                                <div className="position-absolute top-0 end-0 m-2">
                                    <MDBIcon icon="check-circle" className="text-primary" size="lg" />
                                </div>
                            )}
                            <MDBIcon icon="file-pdf" size="2x" className="text-danger mb-2" />
                            <h6>PDF</h6>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div 
                            className={`border rounded p-3 text-center cursor-pointer ${
                                selectedDataSource === 'text' ? 'border-primary bg-light' : 'border-secondary'
                            }`}
                            style={{ cursor: 'pointer', position: 'relative' }}
                            onClick={() => setSelectedDataSource('text')}
                        >
                            {selectedDataSource === 'text' && (
                                <div className="position-absolute top-0 end-0 m-2">
                                    <MDBIcon icon="check-circle" className="text-primary" size="lg" />
                                </div>
                            )}
                            <MDBIcon icon="file-alt" size="2x" className="text-info mb-2" />
                            <h6>Text</h6>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div 
                            className={`border rounded p-3 text-center cursor-pointer ${
                                selectedDataSource === 'qa' ? 'border-primary bg-light' : 'border-secondary'
                            }`}
                            style={{ cursor: 'pointer', position: 'relative' }}
                            onClick={() => setSelectedDataSource('qa')}
                        >
                            {selectedDataSource === 'qa' && (
                                <div className="position-absolute top-0 end-0 m-2">
                                    <MDBIcon icon="check-circle" className="text-primary" size="lg" />
                                </div>
                            )}
                            <MDBIcon icon="question-circle" size="2x" className="text-warning mb-2" />
                            <h6>Q&A</h6>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div 
                            className="border rounded p-3 text-center border-secondary"
                            style={{ opacity: 0.5 }}
                        >
                            <MDBIcon icon="play-circle" size="2x" className="text-danger mb-2" />
                            <h6>YouTube</h6>
                            <small className="text-muted">Coming Soon</small>
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
                    <MDBBtn color="primary" onClick={handleAddWebsite}>
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
                        className={`border border-dashed rounded p-5 text-center ${
                            isDragOver ? 'border-primary bg-light' : 'border-secondary'
                        }`}
                        style={{ 
                            borderWidth: '2px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('pdf-file-input')?.click()}
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
                                {uploadedFiles.map((file, index) => (
                                    <div key={index} className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-light">
                                        <div className="d-flex align-items-center">
                                            <MDBIcon icon="file-pdf" className="text-danger me-2" />
                                            <div>
                                                <div className="fw-medium">{file.name}</div>
                                                <small className="text-muted">{formatFileSize(file.size)}</small>
                                            </div>
                                        </div>
                                        <MDBBtn 
                                            color="danger" 
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                        >
                                            <MDBIcon icon="trash" size="sm" />
                                        </MDBBtn>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-3">
                        <MDBBtn 
                            color="primary"
                            disabled={uploadedFiles.length === 0}
                        >
                            <MDBIcon icon="upload" className="me-1" />
                            Upload & Train ({uploadedFiles.length} files)
                        </MDBBtn>
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
                    <MDBBtn color="primary" onClick={handleAddText}>
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
        <div>
            <h4 className="mb-4">Embed Configuration</h4>
            
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
        <div>
            <h4 className="mb-4">Channels & Deployment</h4>
            
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
        <div className="d-flex justify-content-center mb-4">
            <div className="d-flex align-items-center gap-4">
                {stepLabels.map((step, index) => (
                    <div key={step.number} className="d-flex flex-column align-items-center">
                        <div
                            className={`d-flex align-items-center justify-content-center rounded-circle ${
                                currentStep === step.number
                                    ? 'bg-primary text-white border-primary'
                                    : currentStep > step.number
                                    ? 'bg-success text-white border-success'
                                    : 'bg-light text-muted border-secondary'
                            }`}
                            style={{
                                width: '40px',
                                height: '40px',
                                border: '2px solid',
                                cursor: currentStep >= step.number ? 'pointer' : 'default',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => handleStepClick(step.number)}
                        >
                            <span className="fw-bold">{step.number}</span>
                        </div>
                        <span
                            className={`mt-2 small fw-medium ${
                                currentStep === step.number
                                    ? 'text-primary'
                                    : currentStep > step.number
                                    ? 'text-success'
                                    : 'text-muted'
                            }`}
                            style={{
                                borderBottom: currentStep === step.number ? '2px solid #007bff' : 'none',
                                paddingBottom: currentStep === step.number ? '2px' : '0'
                            }}
                        >
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <MDBContainer>
                <MDBRow className="justify-content-center">
                    <MDBCol md="8">
                        <MDBCard className="shadow">
                            <MDBCardBody className="p-4">
                                {/* Header */}
                                <div className="d-flex justify-content-between align-items-start mb-4">
                                    <div className="flex-grow-1 me-4">
                                        <MDBCardTitle className="h4 mb-1">
                                            Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1].label} Chatbot
                                        </MDBCardTitle>
                                        <p className="text-muted mb-0" style={{ fontSize: '14px', lineHeight: '1.5' }}>
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
                                            borderColor: '#6c757d',
                                            color: '#6c757d',
                                            fontWeight: '500',
                                            borderRadius: '8px',
                                            padding: '8px 16px',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#6c757d';
                                            e.currentTarget.style.color = 'white';
                                            e.currentTarget.style.borderColor = '#6c757d';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = '#6c757d';
                                            e.currentTarget.style.borderColor = '#6c757d';
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
                                <div className="d-flex justify-content-between">
                                    <div>
                                        {currentStep > 1 && (
                                            <MDBBtn
                                                color="light"
                                                onClick={handlePrevious}
                                                className="border"
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
                                            >
                                                Next
                                                <MDBIcon icon="chevron-right" className="ms-1" />
                                            </MDBBtn>
                                        ) : (
                                            <MDBBtn
                                                color="success"
                                                onClick={handleSubmit}
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
