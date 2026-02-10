/**
 * Attachment Service
 * Handles file uploads to the File Attachment API
 * Uses the REST API endpoint to upload files and get fileId
 */

export interface AttachmentUploadResult {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  downloadUrl: string;
  uploadedAt: number;
  status: 'stored';
}

export interface AttachmentMetadata {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: number;
  status: 'stored';
  formattedFileSize: string;
}

export interface FileListResponse {
  chatbotId: string;
  totalFiles: number;
  files: AttachmentMetadata[];
}

export class AttachmentService {
  private apiUrl: string;
  private chatbotId: string;

  constructor(apiUrl: string = '/api/attachments', chatbotId: string = 'default') {
    this.apiUrl = apiUrl;
    this.chatbotId = chatbotId;
  }

  /**
   * Upload a file to the attachment API
   * @param file - The file to upload
   * @param sessionId - Unique session identifier
   * @param onProgress - Optional callback for upload progress
   * @returns Promise with upload result containing fileId
   */
  async uploadFile(
    file: File,
    sessionId: string,
    onProgress?: (progressEvent: ProgressEvent) => void
  ): Promise<AttachmentUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatbotId', this.chatbotId);
    formData.append('sessionId', sessionId);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress if callback provided
      if (onProgress) {
        xhr.upload.addEventListener('progress', onProgress);
      }

      xhr.addEventListener('load', () => {
        if (xhr.status === 201 || xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response as AttachmentUploadResult);
          } catch (error) {
            reject(new Error(`Failed to parse upload response: ${error}`));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during file upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('File upload was cancelled'));
      });

      xhr.open('POST', `${this.apiUrl}/api/attachments/upload`);
      xhr.send(formData);
    });
  }

  /**
   * Download a file using its fileId
   * @param fileId - The file identifier returned from upload
   * @returns Promise with the file blob
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(
      `${this.apiUrl}/api/attachments/download/${fileId}?chatbotId=${this.chatbotId}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Download failed with status ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Get metadata for a file without downloading it
   * @param fileId - The file identifier
   * @returns Promise with file metadata
   */
  async getFileMetadata(fileId: string): Promise<AttachmentMetadata> {
    const response = await fetch(
      `${this.apiUrl}/api/attachments/metadata/${fileId}?chatbotId=${this.chatbotId}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to get metadata with status ${response.status}`);
    }

    return response.json();
  }

  /**
   * List all uploaded files for this chatbot
   * @returns Promise with list of files
   */
  async listFiles(): Promise<FileListResponse> {
    const response = await fetch(`${this.apiUrl}/api/attachments/list/${this.chatbotId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Failed to list files with status ${response.status}`);
    }

    return response.json();
  }

  /**
   * Delete a file
   * @param fileId - The file identifier to delete
   * @returns Promise that resolves when file is deleted
   */
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(
      `${this.apiUrl}/api/attachments/${fileId}?chatbotId=${this.chatbotId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Delete failed with status ${response.status}`);
    }
  }

  /**
   * Generate a download URL for a file
   * @param fileId - The file identifier
   * @returns The download URL
   */
  getDownloadUrl(fileId: string): string {
    return `${this.apiUrl}/api/attachments/download/${fileId}?chatbotId=${this.chatbotId}`;
  }

  /**
   * Trigger a browser download of a file
   * @param fileId - The file identifier
   * @param fileName - The filename for download
   */
  async downloadFileToClient(fileId: string, fileName: string): Promise<void> {
    try {
      const blob = await this.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Create and return a singleton instance of AttachmentService
 */
let attachmentServiceInstance: AttachmentService;

export function getAttachmentService(
  apiUrl?: string,
  chatbotId?: string
): AttachmentService {
  if (!attachmentServiceInstance) {
    const url = apiUrl || process.env.REACT_APP_ATTACHMENT_API_URL || '/api/attachments';
    const botId = chatbotId || process.env.REACT_APP_CHATBOT_ID || 'default';
    attachmentServiceInstance = new AttachmentService(url, botId);
  }
  return attachmentServiceInstance;
}

/**
 * Update the attachment service configuration
 */
export function updateAttachmentService(apiUrl: string, chatbotId: string): void {
  attachmentServiceInstance = new AttachmentService(apiUrl, chatbotId);
}

