import React, { useState, useRef } from 'react';
import { Upload, File as FileIcon, X } from 'lucide-react';

export default function FileUpload({ 
  onFileSelect, 
  accept = '.pdf,.png,.jpg,.jpeg,.xlsx',
  label = '파일 선택'
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  const onButtonClick = () => {
    if (!selectedFile) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      
      <div 
        onClick={onButtonClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer
          ${dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }
          ${selectedFile ? 'bg-slate-50 dark:bg-slate-800' : ''}
        `}
      >
        {selectedFile ? (
          <div className="flex items-center justify-between w-full p-3 bg-white dark:bg-slate-700 rounded-md shadow-sm border border-slate-200 dark:border-slate-600">
            <div className="flex items-center space-x-3 overflow-hidden">
              <FileIcon className="text-blue-500 shrink-0" size={24} />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
            <button 
              onClick={removeFile}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
              title="파일 제거"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mb-3 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Upload size={24} />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center mb-1">
              {label}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              파일을 드래그하여 놓거나 클릭하여 선택하세요
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              지원 형식: {accept}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
