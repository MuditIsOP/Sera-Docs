import React from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Hash, Layers } from 'lucide-react';

/**
 * A modal component to display the details of a source document chunk.
 * It shows metadata like filename and chunk ID, the similarity score,
 * and the full content of the chunk.
 * @param {object} props - The component props.
 * @param {object} props.source - The source chunk object to display.
 * @param {function(): void} props.onClose - Callback function to close the modal.
 * @returns {JSX.Element | null} The rendered SourceViewer modal, or null if no source is provided.
 */
const SourceViewer = ({ source, onClose }) => {
  if (!source) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Source Details
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close source viewer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Metadata */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
              Document Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Filename</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 break-all">
                    {source.metadata?.filename || 'Unknown'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Layers className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Chunk Index</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {source.metadata?.chunk_index !== undefined ? source.metadata.chunk_index : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 col-span-1 md:col-span-2">
                <Hash className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Chunk ID</p>
                  <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                    {source.chunk_id}
                  </p>
                </div>
              </div>

              {source.similarity_score && (
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-primary-500 rounded-full mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Similarity Score</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {(source.similarity_score * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
              Chunk Content
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {source.content}
              </p>
            </div>
          </div>

          {/* Additional Metadata */}
          {source.metadata && Object.keys(source.metadata).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                Full Metadata
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 max-h-40 overflow-y-auto">
                <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-x-auto">
                  {JSON.stringify(source.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SourceViewer;