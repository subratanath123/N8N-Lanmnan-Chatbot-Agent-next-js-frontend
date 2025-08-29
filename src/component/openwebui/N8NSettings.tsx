import React, { useState } from 'react';
import { N8NConfig } from './types';

interface N8NSettingsProps {
  config: N8NConfig;
  onConfigChange: (config: N8NConfig) => void;
  onClose: () => void;
  isVisible: boolean;
}

export default function N8NSettings({
  config,
  onConfigChange,
  onClose,
  isVisible
}: N8NSettingsProps) {
  const [localConfig, setLocalConfig] = useState<N8NConfig>(config);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = () => {
    onConfigChange(localConfig);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!localConfig.workflowId || !localConfig.webhookUrl) {
      setTestResult({ success: false, message: 'Please fill in workflow ID and webhook URL' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/n8n?workflowId=${encodeURIComponent(localConfig.workflowId)}&webhookUrl=${encodeURIComponent(localConfig.webhookUrl)}`);
      const result = await response.json();

      if (result.success) {
        setTestResult({ success: true, message: 'Connection successful! N8N workflow is ready.' });
      } else {
        setTestResult({ success: false, message: result.errorMessage || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to test connection' });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <img 
              src="/favicon.png" 
              alt="Lanmnan" 
              style={{ width: '24px', height: '24px' }}
            />
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#333' }}>
              N8N Workflow Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            <input
              type="checkbox"
              checked={localConfig.enabled}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              style={{ width: '16px', height: '16px' }}
            />
            Enable N8N Workflow
          </label>
        </div>

        {localConfig.enabled && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                Workflow ID
              </label>
              <input
                type="text"
                value={localConfig.workflowId}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, workflowId: e.target.value }))}
                placeholder="Enter N8N workflow ID"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                Webhook URL
              </label>
              <input
                type="url"
                value={localConfig.webhookUrl}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://your-n8n-instance.com/webhook/..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                Additional Parameters (JSON)
              </label>
              <textarea
                value={localConfig.additionalParams ? JSON.stringify(localConfig.additionalParams, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const params = e.target.value ? JSON.parse(e.target.value) : undefined;
                    setLocalConfig(prev => ({ ...prev, additionalParams: params }));
                  } catch (error) {
                    // Invalid JSON, keep the current value
                  }
                }}
                placeholder='{"key": "value"}'
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  minHeight: '80px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={handleTestConnection}
                disabled={isTesting || !localConfig.workflowId || !localConfig.webhookUrl}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  opacity: (isTesting || !localConfig.workflowId || !localConfig.webhookUrl) ? 0.5 : 1
                }}
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>

              {testResult && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: testResult.success ? '#d4edda' : '#f8d7da',
                  color: testResult.success ? '#155724' : '#721c24',
                  fontSize: '14px'
                }}>
                  {testResult.message}
                </div>
              )}
            </div>
          </>
        )}

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
