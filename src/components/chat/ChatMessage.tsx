import React, { useMemo } from 'react';
import { MessageCircle, User } from 'lucide-react';
import type { Message } from '../../types/chat';

interface ChatMessageProps {
  message: Message;
  onActionClick?: (action: string) => void;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
  onUndo?: (messageId: string) => void;
  isThinking?: boolean;
}

export function ChatMessage({ 
  message, 
  onActionClick, 
  onFeedback, 
  onUndo,
  isThinking 
}: ChatMessageProps) {
  const messageContent = useMemo(() => {
    if (typeof message.content === 'string') {
      return message.content;
    }
    return '';
  }, [message.content]);

  const isAI = message.sender === 'ai';

  const getQuickReplyStyle = (index: number, total: number) => {
    return `inline-block px-3 py-1.5 rounded-full 
            ${isAI ? 'bg-[#2b2938] hover:bg-[#343048] text-[#a29db8]' : 
                    'bg-[#3b19e6] hover:bg-[#2f14b8] text-white'} 
            hover:text-white text-sm transition-all
            ${index === 0 ? 'ml-0' : 'ml-2'}`;
  };

  return (
    <div className={`flex gap-3 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    ${isAI ? 'bg-[#3b19e6]' : 'bg-[#2b2938]'} 
                    transition-all duration-300 shadow-lg hover:shadow-xl
                    hover:scale-105`}>
        {isAI ? <MessageCircle size={16} className="text-white" /> : 
                <User size={16} className="text-white" />}
      </div>
      
      <div className={`group flex flex-col gap-2 max-w-[85%] ${isAI ? 'items-start' : 'items-end'}`}>
        <div className={`rounded-lg px-4 py-3 ${
          isAI ? 'bg-[#2b2938] hover:bg-[#343048] shadow-md hover:shadow-lg' : 
                'bg-[#3b19e6] hover:bg-[#2f14b8] shadow-lg hover:shadow-xl'
        }`}>
          <p className="text-sm text-white whitespace-pre-wrap break-words">{messageContent}</p>
          
          {message.quickReplies && message.quickReplies.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                {message.quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => onActionClick?.(reply.action)}
                    className={`inline-block px-3 py-1.5 rounded-lg
                            ${isAI ? 'bg-[#2b2938] hover:bg-[#343048] text-[#a29db8]' : 
                                    'bg-[#3b19e6] hover:bg-[#2f14b8] text-white'} 
                            hover:text-white text-sm transition-all
                            ${index === 0 ? 'ml-0' : 'ml-2'}`}
                    aria-label={`Quick reply: ${reply.label}`}
                    disabled={isThinking}
                  >
                    {reply.icon && (
                      <span className="mr-1.5" aria-hidden="true">
                        {reply.icon}
                      </span>
                    )}
                    {reply.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {isThinking && isAI && (
            <div className="flex items-center gap-2 mt-2 text-[#a29db8] text-sm italic">
              <div className="animate-pulse">Thinking</div>
              <div className="flex gap-1">
                <span className="animate-bounce delay-0">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          )}
        </div>

        {isAI && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => onUndo?.(message.id)}
              className="text-[#a29db8] hover:text-white transition-colors px-2 py-1 
                       rounded-lg hover:bg-[#2b2938] text-sm flex items-center gap-1"
            >
              <span>↩️</span>
              <span>Undo</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onFeedback?.(message.id, 'like')}
                className="text-[#a29db8] hover:text-white transition-colors p-1 
                         rounded-lg hover:bg-[#2b2938]"
                aria-label="Like message"
              >
                👍
              </button>
              <button
                onClick={() => onFeedback?.(message.id, 'dislike')}
                className="text-[#a29db8] hover:text-white transition-colors p-1 
                         rounded-lg hover:bg-[#2b2938]"
                aria-label="Dislike message"
              >
                👎
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}