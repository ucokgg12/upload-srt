
import React, { useState, useCallback, useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);


export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);
  
  const handleDragOut = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files[0].name.endsWith('.srt')) {
          onFileSelect(e.dataTransfer.files[0]);
      }
      e.dataTransfer.clearData();
    }
  }, [onFileSelect]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onFileSelect(e.target.files[0]);
    }
  };
  
  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-8 text-center">
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative flex flex-col items-center justify-center p-10 md:p-16 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-blue-400 bg-gray-700' : 'border-gray-600 hover:border-gray-500'}`}
      >
        <input
            ref={fileInputRef}
            type="file"
            accept=".srt"
            className="hidden"
            onChange={handleChange}
            disabled={isLoading}
        />
        {isLoading ? (
            <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-lg text-gray-300">Processing file...</p>
            </div>
        ) : (
            <>
                <UploadIcon />
                <p className="mt-4 text-lg font-semibold text-gray-300">
                    Drag & drop your .srt file here
                </p>
                <p className="text-gray-500">or</p>
                <button 
                    type="button" 
                    className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
                    disabled={isLoading}
                >
                    Browse File
                </button>
            </>
        )}
      </div>
      {error && (
        <div className="mt-6 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
            <p className="font-bold">Error</p>
            <p>{error}</p>
        </div>
      )}
    </div>
  );
};
