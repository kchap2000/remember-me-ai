import { BaseMemory } from '@langchain/core/memory';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import type { Message } from '../../types/chat';

export class CustomChatMemory extends BaseMemory {
  private messages: (AIMessage | HumanMessage)[] = [];
  private messageHistory: Message[] = [];

  constructor(messages: Message[] = []) {
    super();
    this.loadMessages(messages);
  }

  get memoryKeys() {
    return ['history'];
  }

  async loadMemoryVariables() {
    return {
      history: this.messages
    };
  }

  async saveContext(inputValues: { input: string }, outputValues: { response: string }) {
    const humanMessage = new HumanMessage(inputValues.input);
    const aiMessage = new AIMessage(outputValues.response);
    
    this.messages.push(humanMessage);
    this.messages.push(aiMessage);
    
    // Save to message history
    this.messageHistory.push({
      id: Date.now().toString(),
      content: inputValues.input,
      sender: 'user',
      timestamp: new Date()
    });
    this.messageHistory.push({
      id: (Date.now() + 1).toString(),
      content: outputValues.response,
      sender: 'ai',
      timestamp: new Date()
    });
  }

  async clear() {
    this.messages = [];
    this.messageHistory = [];
  }

  private loadMessages(messages: Message[]) {
    messages.forEach(message => {
      if (message.sender === 'user') {
        this.messages.push(new HumanMessage(message.content));
      } else {
        this.messages.push(new AIMessage(message.content));
      }
    });
    this.messageHistory = messages;
  }

  getMessageHistory(): Message[] {
    return this.messageHistory;
  }
}