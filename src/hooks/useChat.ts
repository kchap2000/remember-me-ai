import { useState, useCallback } from 'react';
import { aiService } from '../services/ai.service';
import type { Message } from '../types/chat';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    addMessage(userMessage);
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await aiService.generateSuggestion(content);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date(),
        actions: [
          { type: 'continue', icon: '✍️', label: 'Continue' },
          { type: 'improve', icon: '🎨', label: 'Improve' },
          { type: 'develop', icon: '👥', label: 'Develop' }
        ]
      };
      addMessage(aiMessage);
    } catch (err) {
      setError('Failed to get AI response');
    } finally {
      setLoading(false);
    }
  }, [addMessage]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    addMessage
  };
}