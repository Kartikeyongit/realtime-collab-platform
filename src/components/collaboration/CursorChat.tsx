'use client';

import { useState, useEffect } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';
import { MessageCircle } from 'lucide-react';

interface CursorChatProps {
  documentId: string;
}

export function CursorChat({ documentId }: CursorChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const { socket } = useCollaboration(documentId);

  useEffect(() => {
    if (!socket) return;

    socket.on('cursor-chat:message', (message: any) => {
      setMessages(prev => [...prev, message]);
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== message.id));
      }, 5000);
    });

    return () => {
      socket.off('cursor-chat:message');
    };
  }, [socket]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    const message = {
      id: Date.now().toString(),
      text: inputMessage,
      timestamp: new Date().toISOString(),
    };

    socket.emit('cursor-chat:message', message);
    setMessages(prev => [...prev, message]);
    setInputMessage('');

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== message.id));
    }, 5000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className="bg-white shadow-lg rounded-lg px-4 py-2 text-sm animate-slide-up"
        >
          {message.text}
        </div>
      ))}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
