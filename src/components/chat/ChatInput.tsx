import React, { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { VoiceRecorder } from '../story/VoiceRecorder';
import { polishText } from '../../utils/text';
import { Language, TextStyle } from '../../utils/types';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  language?: Language;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Type your message...",
  language = Language.English
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const processAndSendMessage = useCallback(async (text: string) => {
    if (!text?.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await polishText(text, {
        language,
        textStyle: TextStyle.Casual,
        fixPunctuation: true,
        capitalizeFirst: true,
        maxRetries: 3
      });

      if (result.text) {
        onSend(result.text);
      } else {
        onSend(text.trim());
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Fallback to original text if processing fails
      onSend(text.trim());
    } finally {
      setIsProcessing(false);
    }
  }, [onSend, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isProcessing) return;
    
    await processAndSendMessage(message);
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleTranscription = async (text: string) => {
    if (!text?.trim() || isProcessing) return;
    await processAndSendMessage(text);
  };

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`; // max 128px
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4">
      <VoiceRecorder
        onTranscription={handleTranscription}
        className="flex-shrink-0"
        disabled={disabled || isProcessing}
      />
      
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          disabled={disabled || isProcessing}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-[#2b2938] text-white rounded-lg 
                   placeholder:text-[#5b5676] resize-none border border-[#403c53] 
                   focus:border-[#3b19e6] focus:outline-none min-h-[44px] max-h-32
                   disabled:opacity-50 disabled:cursor-not-allowed
                   scrollbar-thin scrollbar-thumb-[#403c53] scrollbar-track-transparent"
          rows={1}
          onKeyDown={handleKeyDown}
        />
      </div>
      <button
        type="submit"
        disabled={!message.trim() || disabled || isProcessing}
        className="flex-shrink-0 p-3 rounded-xl bg-[#3b19e6] text-white 
                 disabled:opacity-50 disabled:cursor-not-allowed 
                 hover:bg-[#2f14b8] transition-colors"
        aria-label="Send message"
      >
        <Send size={20} />
      </button>
    </form>
  );
}