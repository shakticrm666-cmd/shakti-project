import { useState, useCallback } from 'react';

export const useFileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validation
    const validExtensions = ['.xlsx', '.xls'];
    const isValid = validExtensions.some(ext =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!isValid) {
      alert('Please select an Excel file');
      return;
    }

    setFile(selectedFile);
    setStatus('File selected successfully');
  }, []);

  const uploadFile = useCallback(async (url: string, additionalData?: Record<string, unknown>) => {
    if (!file) {
      alert('No file selected');
      return null;
    }

    setIsUploading(true);
    setProgress(0);
    setStatus('Uploading...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      setProgress(100);
      setStatus('Upload successful');
      alert('File uploaded successfully');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setStatus(`Error: ${errorMessage}`);
      alert(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [file]);

  const reset = useCallback(() => {
    setFile(null);
    setProgress(0);
    setStatus('');
  }, []);

  return {
    file,
    isUploading,
    progress,
    status,
    handleFileSelect,
    uploadFile,
    reset,
  };
};