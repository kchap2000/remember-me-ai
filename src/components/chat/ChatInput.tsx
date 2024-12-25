import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { VoiceRecorder } from '../story/VoiceRecorder';
import { polishText } from '../../utils/text';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Type your message..." }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    try {
      const result = await polishText(message);
      onSend(result.text);
      setMessage('');
    } catch (error) {
      console.error('Error processing message:', error);
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleTranscription = async (text: string) => {
    if (!text?.trim()) return;
    try {
      const result = await polishText(text);
      onSend(result.text);
    } catch (error) {
      console.error('Error processing transcription:', error);
      onSend(text.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4">
      <VoiceRecorder
        onTranscription={handleTranscription}
        className="flex-shrink-0"
      />
      
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-[#2b2938] text-white rounded-lg 
                   placeholder:text-[#5b5676] resize-none border border-[#403c53] 
                   focus:border-[#3b19e6] focus:outline-none min-h-[44px] max-h-32
                   disabled:opacity-50 disabled:cursor-not-allowed"
          rows={1}
          onKeyDown={handleKeyDown}
        />
      </div>

      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className="flex-shrink-0 p-3 rounded-xl bg-[#3b19e6] text-white 
                 disabled:opacity-50 disabled:cursor-not-allowed 
                 hover:bg-[#2f14b8] transition-colors"
      >
        <Send size={20} />
      </button>
    </form>
  );
}