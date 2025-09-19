import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from './components/ChatInterface';
import FileUpload from './components/FileUpload';
import SourceViewer from './components/SourceViewer';
import { FileText, MessageSquare, Upload, Moon, Sun, Trash2 } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleQuery = async (query) => {
    // Add user message
    const userMessage = { id: Date.now(), text: query, role: 'user' };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: 5, use_generation: true })
      });

      const data = await response.json();
      
      // Add assistant message
      const assistantMessage = {
        id: Date.now() + 1,
        text: data.answer || 'No answer generated.',
        role: 'assistant',
        sources: data.sources
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setSources(data.sources || []);
    } catch (error) {
      console.error('Query error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error processing your request.',
        role: 'assistant'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const clearAllFiles = async () => {
    if (!uploadedFiles.length) {
      alert('No files to clear');
      return;
    }
    
    if (!confirm('Are you sure you want to clear all files? Sera will forget everything in her current library. 📚')) {
      return;
    }

    try {
      const response = await fetch('/api/clear', {
        method: 'DELETE',
      });

      if (response.ok) {
        setUploadedFiles([]);
        setMessages([]);
        setSources([]);
        
        // Add success message
        const successMessage = {
          id: Date.now(),
          text: "All cleared! Sera's library is now fresh and ready for new documents. ✨",
          role: 'system'
        };
        setMessages([successMessage]);
      } else {
        throw new Error('Failed to clear files');
      }
    } catch (error) {
      console.error('Clear error:', error);
      alert('Failed to clear files: ' + error.message);
    }
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          id: data.file_id,
          chunks: data.chunks_created
        }]);
        
        // Add success message
        const successMessage = {
          id: Date.now(),
          text: `Successfully uploaded ${file.name} (${data.chunks_created} chunks created)`,
          role: 'system'
        };
        setMessages(prev => [...prev, successMessage]);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = {
        id: Date.now(),
        text: `Failed to upload ${file.name}: ${error.message}`,
        role: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 relative"
        >
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="absolute right-0 top-0 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700" />
            )}
          </button>
          
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Sera Docs
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Let Sera help you find answers inside your files
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
            Sera 🌸 your warm, clever companion through everything you've written 💫
          </p>
        </motion.header>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - File Upload */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
                <Upload className="w-5 h-5" />
                Add to Sera's Library
              </h2>
              <FileUpload 
                onFileUpload={handleFileUpload}
                isUploading={isUploading}
              />
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Uploaded Documents ({uploadedFiles.length})
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearAllFiles}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                      title="Clear all uploaded files"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear All
                    </motion.button>
                  </div>
                  <div className="space-y-2">
                    {uploadedFiles.map(file => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                          {file.chunks} chunks
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Center - Chat Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-[600px] flex flex-col transition-colors duration-200">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                  <MessageSquare className="w-5 h-5" />
                  Conversations with Sera
                </h2>
              </div>
              <ChatInterface 
                messages={messages}
                onSendMessage={handleQuery}
                onSourceClick={setSelectedSource}
              />
            </div>
          </motion.div>
        </div>

        {/* Source Viewer Modal */}
        <AnimatePresence>
          {selectedSource && (
            <SourceViewer
              source={selectedSource}
              onClose={() => setSelectedSource(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;