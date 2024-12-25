import { useCallback } from 'react';
import { aiService } from '../../../services/ai.service';
import type { Message } from '../../../types/chat';

export function useMessageHandling(sendMessage: (message: Message) => void) {
  const handleMessageSend = useCallback(async (
    content: string,
    storyContent: string,
    storyMetadata: any,
    setIsThinking: (thinking: boolean) => void
  ) => {
    if (!content.trim()) return;

    sendMessage({
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    });

    setIsThinking(true);
    try {
      const response = await aiService.analyzeAndRespond({
        storyContent,
        storyMetadata,
        userMessage: content
      });
      
      sendMessage({
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date(),
        quickReplies: await aiService.generateQuickReplies()
      });
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsThinking(false);
    }
  }, [sendMessage]);

  return { handleMessageSend };
}