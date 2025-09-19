import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, File, AlertCircle } from 'lucide-react';

const FileUpload = ({ onFileUpload, isUploading }) => {
  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      alert(`File rejected: ${rejectedFiles[0].errors[0].message}`);
      return;
    }
    
    if (acceptedFiles.length > 0) {
      // Upload files sequentially to reuse the existing single-file endpoint
      for (const file of acceptedFiles) {
        // Await to preserve order and avoid overlapping spinners/state
        // eslint-disable-next-line no-await-in-loop
        await onFileUpload(file);
      }
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'text/html': ['.html'],
    },
    multiple: true,
    maxFiles: 50,
    maxSize: 52428800, // 50MB
    disabled: isUploading
  });

  return (
    <div>
      <motion.div
        {...getRootProps()}
        whileHover={{ scale: isUploading ? 1 : 1.02 }}
        whileTap={{ scale: isUploading ? 1 : 0.98 }}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="flex flex-col items-center"
        >
          {isUploading ? (
            <>
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Adding to Sera's library... 📚✨</p>
            </>
          ) : isDragActive ? (
            <>
              <Upload className="w-12 h-12 text-primary-500 mb-4" />
              <p className="text-primary-600 font-medium">Drop it here for Sera 💕</p>
            </>
          ) : (
            <>
              <File className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                Drag & drop files here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or click to select one or more
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Supports: PDF, DOCX, PPTX, TXT, CSV, HTML
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Max size: 50MB
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
      
      {acceptedFiles.length > 0 && !isUploading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg flex items-center gap-2"
        >
          <File className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-700 dark:text-green-300">
            Ready for Sera: {acceptedFiles.length === 1 ? acceptedFiles[0].name : `${acceptedFiles.length} files`}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;