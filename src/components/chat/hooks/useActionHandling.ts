import { useCallback } from 'react';
import { aiService } from '../../../services/ai.service';
import type { Message } from '../../../types/chat';

export function useActionHandling(sendMessage: (message: Message) => void) {
  const handleActionClick = useCallback(async (
    action: string,
    lastSession: { topic?: string; timestamp: number } | undefined,
    setIsThinking: (thinking: boolean) => void
  ) => {
    setIsThinking(true);
    
    try {
      const response = await aiService.handleAction(action, {
        lastSession,
        lastMessage: undefined
      });
      
      if (response) {
        sendMessage({
          id: Date.now().toString(),
          content: response,
          sender: 'ai',
          timestamp: new Date(),
          quickReplies: await aiService.generateQuickReplies()
        });
      }
    } catch (error) {
      console.error('Error handling action:', error);
    } finally {
      setIsThinking(false);
    }
  }, [sendMessage]);

  return { handleActionClick };
}