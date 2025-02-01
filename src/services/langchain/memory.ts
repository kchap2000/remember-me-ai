import { BaseMemory, ChatMessageHistory } from 'langchain/memory';
import { AIMessage, HumanMessage } from 'langchain/schema';
import type { Message } from '../../types/chat';

export class CustomChatMemory extends BaseMemory {
  private history: ChatMessageHistory;
  private messageHistory: Message[] = [];

  constructor(messages: Message[] = []) {
    super();
    this.history = new ChatMessageHistory();
    this.loadMessages(messages);
  }

  get memoryKeys() {
    return ['history'];
  }

  async loadMemoryVariables() {
    const messages = await this.history.getMessages();
    return {
      history: messages
    };
  }

  async saveContext(inputValues: { input: string }, outputValues: { response: string }) {
    const humanMessage = new HumanMessage(inputValues.input);
    const aiMessage = new AIMessage(outputValues.response);
    
    await this.history.addMessage(humanMessage);
    await this.history.addMessage(aiMessage);
    
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
    await this.history.clear();
    this.messageHistory = [];
  }

  private async loadMessages(messages: Message[]) {
    for (const message of messages) {
      if (message.sender === 'user') {
        const humanMessage = new HumanMessage(message.content);
        await this.history.addMessage(humanMessage);
      } else {
        const aiMessage = new AIMessage(message.content);
        await this.history.addMessage(aiMessage);
      }
    }
    this.messageHistory = messages;
  }

  getMessageHistory(): Message[] {
    return this.messageHistory;
  }
}