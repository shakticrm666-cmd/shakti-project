import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileText, AlertTriangle, Download } from 'lucide-react';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalData?: {
    isUploading: boolean;
    uploadProgress: number;
    uploadResults: {
      successful: number;
      failed: number;
      errors: Array<{ row: number; error: string; data?: Record<string, unknown> }>;
    } | null;
  };
  onUpload: (file: File) => Promise<void>;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  modalData,
  onUpload
}) => {
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
        !file.name.endsWith('.xlsx')) {
        alert('Please select a valid .xlsx file');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file to upload');
      return;
    }

    await onUpload(uploadFile);
  };

  const downloadErrorLog = () => {
    if (!modalData?.uploadResults?.errors.length) return;

    const errorData = modalData.uploadResults.errors.map(error => ({
      'Row Number': error.row,
      'Error': error.error,
      'Name': error.data?.Name || '',
      'Mobile': error.data?.Mobile || '',
      'EMP ID': error.data?.['EMP ID'] || '',
      'Role': error.data?.Role || '',
      'Status': error.data?.Status || ''
    }));

    const ws = XLSX.utils.json_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Error Log');

    const colWidths = [
      { wch: 10 }, // Row Number
      { wch: 50 }, // Error
      { wch: 20 }, // Name
      { wch: 15 }, // Mobile
      { wch: 10 }, // EMP ID
      { wch: 12 }, // Role
      { wch: 10 }  // Status
    ];
    ws['!cols'] = colWidths;

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'upload_errors.xlsx');
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Excel File (.xlsx)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            className="hidden"
            id="bulk-upload-file"
            disabled={modalData?.isUploading}
          />
          <label
            htmlFor="bulk-upload-file"
            className={`cursor-pointer ${modalData?.isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-2">
              {uploadFile ? uploadFile.name : 'Click to select or drag and drop your Excel file'}
            </p>
            <p className="text-sm text-gray-500">
              Maximum 500 records per upload
            </p>
          </label>
        </div>
      </div>

      {modalData?.isUploading && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Processing...</span>
            <span className="text-sm text-gray-500">{Math.round(modalData.uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${modalData.uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {modalData?.uploadResults && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{modalData.uploadResults.successful}</div>
              <div className="text-sm text-green-800">Successful</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{modalData.uploadResults.failed}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
          </div>

          {/* Errors */}
          {modalData.uploadResults.errors.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-red-900 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Errors ({modalData.uploadResults.errors.length})
                </h4>
                <button
                  onClick={downloadErrorLog}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md inline-flex items-center"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download Error Log
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {modalData.uploadResults.errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-sm text-red-800 bg-red-100 p-2 rounded">
                    <span className="font-medium">Row {error.row}:</span> {error.error}
                  </div>
                ))}
                {modalData.uploadResults.errors.length > 10 && (
                  <div className="text-sm text-red-600 text-center">
                    ... and {modalData.uploadResults.errors.length - 10} more errors
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {modalData.uploadResults.successful > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 text-sm">
                ✅ {modalData.uploadResults.successful} employee(s) were successfully added to the system.
                The employee list has been updated.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use the downloaded template for correct format</li>
          <li>• Required columns: Name, Mobile, EMP ID, Role</li>
          <li>• Role must be: Telecaller or TeamIncharge</li>
          <li>• Status (optional): active or inactive</li>
          <li>• No duplicate EMP IDs or mobile numbers allowed</li>
        </ul>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-sm font-medium"
          disabled={modalData?.isUploading}
        >
          {modalData?.uploadResults ? 'Close' : 'Cancel'}
        </button>
        {!modalData?.uploadResults && (
          <button
            onClick={handleBulkUpload}
            disabled={!uploadFile || modalData?.isUploading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {modalData?.isUploading ? 'Uploading...' : 'Upload & Process'}
          </button>
        )}
      </div>
    </div>
  );
};