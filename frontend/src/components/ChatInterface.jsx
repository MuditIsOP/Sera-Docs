import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, FileText, Loader, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/**
 * A memoized component to display a single message bubble.
 * Memoization prevents re-renders on parent state changes (e.g., input keystrokes),
 * which eliminates UI flicker and improves performance.
 * @param {object} props - The component props.
 * @param {object} props.message - The message object to display.
 * @param {boolean} props.isSpeaking - Flag indicating if this message is currently being spoken.
 * @param {boolean} props.hasSynth - Flag indicating if speech synthesis is available.
 * @param {function(string): void} props.onSpeak - Callback to speak the message text.
 * @param {function(object): void} props.onSourceClick - Callback when a source is clicked.
 * @returns {JSX.Element} The rendered message bubble.
 */
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

/**
 * The main chat interface component.
 * It manages the conversation flow, user input, and interactions with Web Speech APIs
 * for voice input (SpeechRecognition) and text-to-speech (SpeechSynthesis).
 * @param {object} props - The component props.
 * @param {Array<object>} props.messages - The array of messages to display.
 * @param {function(string): Promise<void>} props.onSendMessage - Callback to send a message.
 * @param {function(object): void} props.onSourceClick - Callback when a source is clicked.
 * @returns {JSX.Element} The rendered chat interface.
 */
const ChatInterface = ({ messages, onSendMessage, onSourceClick }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef(null); // Ref to scroll to the end of messages
  const recognitionRef = useRef(null); // Ref to store the SpeechRecognition instance
  const synthRef = useRef(null); // Ref to store the SpeechSynthesis instance

  // Effect to initialize Speech Recognition and Synthesis APIs on component mount.
  useEffect(() => {
    // Check for browser support for SpeechRecognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript;
          setInput(prev => (prev ? `${prev} ` : '') + transcript);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          // Provide user-friendly alerts for common errors
          if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone permissions in your browser settings.');
          } else if (event.error === 'no-speech') {
            console.log('No speech detected.');
          }
        };

        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
        setSpeechSupported(true);
      } catch (e) {
        console.error('Failed to initialize speech recognition:', e);
        setSpeechSupported(false);
      }
    } else {
      setSpeechSupported(false);
    }

    // Check for browser support for SpeechSynthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      // Pre-load voices
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = () => synthRef.current.getVoices();
      }
    }

    // Cleanup function to stop recognition and synthesis on unmount
    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, []);

  /**
   * Scrolls the message container to the bottom to show the latest message.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect to scroll to bottom whenever messages array changes.
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Toggles the voice input (speech recognition).
   * Starts listening if not already, or aborts if it is.
   */
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.abort();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Error starting recognition:', e);
        alert('Could not start voice input. Please ensure microphone permissions are granted.');
      }
    }
  };

  /**
   * Speaks the given text using the Web Speech Synthesis API.
   * Attempts to use a female voice if available.
   * @param {string} text - The text to be spoken.
   */
  const speakMessage = (text) => {
    if (!synthRef.current) return;

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.1;
    utterance.rate = 0.95;
    
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
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  /**
   * Handles the submission of the chat input form.
   * It calls the onSendMessage prop and manages the loading state.
   * @param {React.FormEvent} e - The form submission event.
   */
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