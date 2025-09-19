import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, FileText, Loader, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Extracting MessageBubble outside the ChatInterface component prevents remounts
// on every parent state change (e.g., input keystrokes), eliminating flicker.
const MessageBubble = React.memo(({ message, isSpeaking, hasSynth, onSpeak, onSourceClick }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary-500' : isSystem ? 'bg-gray-500' : 'bg-gray-700'
        }`}>
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : isSystem ? (
            <FileText className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className="flex items-start gap-2">
            <div className={`px-4 py-3 rounded-2xl ${
              isUser 
                ? 'bg-primary-500 text-white' 
                : isSystem 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200'
            }`}>
              {isUser || isSystem ? (
                <p className="text-sm">{message.text}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
              )}
            </div>
            {!isUser && hasSynth && (
              <button
                onClick={() => onSpeak(message.text)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            )}
          </div>

          {/* Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-gray-500">Sources:</span>
              {message.sources.map((source, idx) => (
                <motion.button
                  key={source.chunk_id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSourceClick(source)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                >
                  {source.metadata?.filename || `Source ${idx + 1}`}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

const ChatInterface = ({ messages, onSendMessage, onSourceClick }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check for speech recognition support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;  // Change to false for better compatibility
        recognition.interimResults = false;  // Simpler approach
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript;
          
          // Append the transcript to existing input
          setInput(prevInput => {
            // Add space if there's existing text
            const separator = prevInput.length > 0 ? ' ' : '';
            return prevInput + separator + transcript;
          });
          
          console.log('Transcript received:', transcript);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          if (event.error === 'no-speech') {
            console.log('No speech was detected. Please try again.');
          } else if (event.error === 'audio-capture') {
            alert('No microphone found. Please ensure your microphone is connected.');
          } else if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone permissions and reload the page.');
          } else if (event.error === 'network') {
            alert('Network error. Please check your internet connection.');
          } else if (event.error === 'aborted') {
            console.log('Speech recognition aborted');
          } else {
            alert(`Speech recognition error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          console.log('Recognition ended');
          setIsListening(false);
        };

        recognition.onstart = () => {
          console.log('Voice recognition activated. Speak now!');
        };
        
        recognition.onspeechend = () => {
          console.log('Speech ended');
          recognition.stop();
        };

        recognitionRef.current = recognition;
        setSpeechSupported(true);
        console.log('Speech recognition initialized successfully');
      } catch (e) {
        console.error('Failed to initialize speech recognition:', e);
        setSpeechSupported(false);
      }
    } else {
      console.log('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      setSpeechSupported(false);
    }

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      // Load voices
      const loadVoices = () => {
        const voices = synthRef.current.getVoices();
        if (voices.length > 0) {
          console.log('Available voices:', voices.map(v => v.name));
        }
      };
      
      // Load voices immediately and on change
      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      console.log('Stopping voice recognition...');
      try {
        recognitionRef.current.abort();  // Use abort instead of stop
        setIsListening(false);
      } catch (e) {
        console.error('Error stopping recognition:', e);
        setIsListening(false);
      }
    } else {
      console.log('Starting voice recognition...');
      setIsListening(true);
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        try {
          recognitionRef.current.start();
          console.log('Recognition started');
        } catch (e) {
          console.error('Error starting recognition:', e);
          setIsListening(false);
          
          if (e.message.includes('already started')) {
            // If already started, stop and restart
            recognitionRef.current.abort();
            setTimeout(() => {
              recognitionRef.current.start();
            }, 100);
          } else {
            alert('Failed to start voice input. Please ensure:\n1. You are using Chrome, Edge, or Safari\n2. Microphone permissions are allowed\n3. The page is served over HTTPS or localhost');
          }
        }
      }, 100);
    }
  };

  // Speak message with female voice
  const speakMessage = (text) => {
    if (!synthRef.current) return;

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set female voice properties
    utterance.pitch = 1.1; // Slightly higher pitch for feminine voice
    utterance.rate = 0.95; // Slightly slower for clarity
    
    // Try to select a female voice
    const voices = synthRef.current.getVoices();
    const femaleVoices = voices.filter(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('woman') ||
      voice.name.toLowerCase().includes('zira') || // Microsoft female voice
      voice.name.toLowerCase().includes('hazel') || // Microsoft female voice
      voice.name.toLowerCase().includes('susan') || // Microsoft female voice
      voice.name.toLowerCase().includes('linda') ||
      voice.name.toLowerCase().includes('heather') ||
      voice.name.toLowerCase().includes('catherine') ||
      voice.name.toLowerCase().includes('samantha') || // macOS female voice
      voice.name.toLowerCase().includes('victoria') || // macOS female voice
      voice.name.toLowerCase().includes('allison') ||
      voice.name.toLowerCase().includes('ava') ||
      voice.name.toLowerCase().includes('susan') ||
      voice.name.toLowerCase().includes('vicki') ||
      voice.name.toLowerCase().includes('kathy') ||
      voice.name.match(/\bfemale\b/i)
    );
    
    // If female voice found, use it, otherwise try to find any English voice
    if (femaleVoices.length > 0) {
      utterance.voice = femaleVoices[0];
    } else {
      // Fallback to any female-sounding or English voice
      const englishVoices = voices.filter(voice => 
        voice.lang.startsWith('en') && 
        !voice.name.toLowerCase().includes('male') &&
        !voice.name.toLowerCase().includes('david') &&
        !voice.name.toLowerCase().includes('mark') &&
        !voice.name.toLowerCase().includes('james')
      );
      if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0];
      }
    }
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput('');
    setIsLoading(true);
    
    await onSendMessage(query);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bot className="w-12 h-12 mb-4" />
            <p className="text-lg">Hello there! 💕 I'm Sera, your friendly knowledge companion</p>
            <p className="text-sm">Share some documents with me and I'll help you discover all the wonderful insights within them ✨</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                isSpeaking={isSpeaking}
                hasSynth={Boolean(synthRef.current)}
                onSpeak={speakMessage}
                onSourceClick={onSourceClick}
              />
            ))}
          </AnimatePresence>
        )}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-4"
          >
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl">
                <Loader className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          {speechSupported && (
            <div className="relative">
              <motion.button
                type="button"
                onClick={toggleVoiceInput}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
                title={isListening ? "Stop listening (click to stop)" : "Start voice input (click and speak)"}
              >
                {isListening ? (
                  <div className="flex items-center gap-2">
                    <MicOff className="w-5 h-5" />
                    <span className="text-xs">Listening...</span>
                  </div>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </motion.button>
              {isListening && (
                <div className="absolute -top-2 -right-2">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask Sera about your documents..."}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isLoading}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;