import React, { useRef } from 'react';

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  attachments: File[];
  setAttachments: (files: File[]) => void;
  showAttachments: boolean;
  setShowAttachments: (show: boolean) => void;
  getFileIcon: (file: File) => string;
  removeAttachment: (index: number) => void;
  isProcessingAttachments?: boolean;
}

export default function ChatInput({
  inputValue,
  setInputValue,
  handleSendMessage,
  isLoading,
  attachments,
  setAttachments,
  showAttachments,
  setShowAttachments,
  getFileIcon,
  removeAttachment,
  isProcessingAttachments = false
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    // Only allow one attachment at a time
    if (files.length > 0) {
      setAttachments([files[0]]); // Take only the first file
      setShowAttachments(true);
    }
    // Clear the input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      borderTop: '1px solid #e9ecef',
      backgroundColor: 'white',
      boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04)',
      animation: 'slideInUp 0.6s ease-out 1.8s both'
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      {/* Attachments Preview - Hidden */}
      {/* {showAttachments && attachments.length > 0 && (
        <div style={{
          marginBottom: '12px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            📎 Attachment
            {isProcessingAttachments && (
              <span style={{ 
                fontSize: '12px', 
                color: '#007bff', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '12px', 
                  height: '12px', 
                  border: '2px solid #007bff', 
                  borderTop: '2px solid transparent', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }}></span>
                Converting to base64...
              </span>
            )}
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {attachments.map((file, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                fontSize: '12px'
              }}>
                <span>{getFileIcon(file)}</span>
                <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#dc3545',
                    fontSize: '12px',
                    padding: '2px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )} */}
      
      <form onSubmit={handleSendMessage} style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end'
      }}>
        {/* Attachment Button - Hidden */}
        {/* <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '12px',
            backgroundColor: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '12px',
            cursor: 'pointer',
            color: '#6c757d',
            fontSize: '16px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '44px',
            height: '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
            e.currentTarget.style.borderColor = '#dee2e6';
            e.currentTarget.style.color = '#333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#e9ecef';
            e.currentTarget.style.color = '#6c757d';
          }}
        >
          📎
        </button> */}
        
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Message AI Assistant..."
            style={{
              width: '100%',
              padding: '14px 18px',
              border: '1px solid #e9ecef',
              borderRadius: '16px',
              resize: 'none',
              fontSize: '14px',
              fontFamily: 'inherit',
              minHeight: '44px',
              maxHeight: '120px',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.2s ease'
            }}
            rows={1}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e as any);
              }
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          style={{
            padding: '14px 18px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: '16px',
            opacity: (!inputValue.trim() || isLoading) ? 0.5 : 1,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
          }}
        >
          ➤
        </button>
      </form>
    </div>
  );
} 