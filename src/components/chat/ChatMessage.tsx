import React from 'react';
import { MessageCircle, User } from 'lucide-react';
import type { Message } from '../../types/chat';
import { cn } from '../../utils/cn';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.sender === 'ai';

  return (
    <div className={`flex gap-3 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full",
        "flex items-center justify-center",
        "transition-all duration-300 shadow-lg hover:shadow-xl",
        "hover:scale-105",
        isAI ? "bg-[#3b19e6]" : "bg-[#2b2938]"
      )}>
        {isAI ? 
          <MessageCircle size={16} className="text-white" /> : 
          <User size={16} className="text-white" />
        }
      </div>
      
      <div className={cn(
        "group flex flex-col gap-2 max-w-[85%]",
        isAI ? "items-start" : "items-end"
      )}>
        <div className={cn(
          "rounded-lg px-4 py-3",
          isAI 
            ? "bg-[#2b2938] hover:bg-[#343048] shadow-md hover:shadow-lg" 
            : "bg-[#3b19e6] hover:bg-[#2f14b8] shadow-lg hover:shadow-xl"
        )}>
          <p className="text-sm text-white whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}