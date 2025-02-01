import { db } from '../config/firebase.config';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { aiService } from './ai.service';
import type { Message, StoryContext } from '../types/chat';

class ChatService {
  private memory: Message[] = [];

  async processMessage(
    userId: string,
    message: string,
    storyContext: StoryContext
  ) {
    try {
      // Add story context to the conversation
      const contextPrompt = `
        Current Story Context:
        Title: ${storyContext.metadata.title}
        Content: ${storyContext.content}
        Year: ${storyContext.metadata.year}
        Tags: ${storyContext.metadata.tags.join(', ')}
        
        User Message: ${message}
        
        Please provide a response that:
        1. Considers the story's existing content and context
        2. Maintains consistency with previously established details
        3. Offers specific, relevant suggestions or insights
        4. Helps develop the story further
      `;

      // Get AI response using our existing aiService
      const response = await aiService.processMessage(message, {
        storyContent: storyContext.content,
        messageHistory: this.memory
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to get AI response');
      }

      // Create messages
      const userMessage: Message = {
        id: Date.now().toString(),
        content: message,
        sender: 'user',
        timestamp: new Date()
      };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.text || '',
        sender: 'ai',
        timestamp: new Date()
      };

      // Update memory
      this.memory.push(userMessage, aiMessage);

      // Save to Firebase
      await this.saveChatHistory(userId, userMessage);
      await this.saveChatHistory(userId, aiMessage);

      return aiMessage;
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }

  async generateStoryUpdate(
    userId: string,
    storyContent: string,
    chatContext: string
  ) {
    try {
      // Use existing aiService to generate story update
      const response = await aiService.processMessage('', {
        storyContent,
        messageHistory: this.memory,
        updateMode: true
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate story update');
      }

      return response.text || '';
    } catch (error) {
      console.error('Error generating story update:', error);
      throw error;
    }
  }

  private async saveChatHistory(userId: string, message: Message) {
    try {
      const chatRef = doc(collection(db, 'chat_history'), userId);
      const chatDoc = await getDoc(chatRef);
      
      const messages = chatDoc.exists() 
        ? [...chatDoc.data().messages, message]
        : [message];

      await setDoc(chatRef, { messages }, { merge: true });
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  async loadChatHistory(userId: string): Promise<Message[]> {
    try {
      const chatRef = doc(collection(db, 'chat_history'), userId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const messages = chatDoc.data().messages;
        this.memory = messages; // Update memory with loaded messages
        return messages;
      }
      return [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }

  clearMemory() {
    this.memory = [];
  }
}

export const chatService = new ChatService();