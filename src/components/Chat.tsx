'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { useChat } from 'ai/react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: number;
  title: string;
  messages: ChatMessage[];
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    api: '/api/agent',
    body: {
      conversationId,
    },
    onResponse: (response) => {
      const newConversationId = response.headers.get('X-Conversation-Id');
      if (newConversationId) {
        setConversationId(newConversationId);
      }
    },
    async onFinish() {
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  const handleConversationSelect = async (conversationId: number) => {
    try {
      setSelectedConversation(conversationId);
      setConversationId(conversationId.toString());
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (response.ok) {
        const historyMessages = await response.json();
        setSelectedConversation(conversationId);
        setConversationId(conversationId.toString());
        // Reset chat messages with loaded history
        messages.splice(0, messages.length);
        historyMessages.forEach((msg: ChatMessage) => {
          messages.push(msg);
        });
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations(prev => {
          const newConvs = prev.filter(conv => conv.id !== conversationId);
          if (newConvs.length === 0) {
            setSelectedConversation(null);
            setConversationId(null);
          } else if (selectedConversation === conversationId) {
            setSelectedConversation(newConvs[0].id);
            setConversationId(newConvs[0].id.toString());
          }
          return newConvs;
        });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleClearAllConversations = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'DELETE',
      });

      if (response.ok) {
      setConversations([]);
      setSelectedConversation(null);
      setConversationId(null);
      }
    } catch (error) {
      console.error('Error clearing conversations:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }
  };

  return (
    <div className="flex h-screen max-w-6xl mx-auto p-4 gap-4">
      <div className="w-64 flex flex-col gap-2">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAllConversations}
            disabled={conversations.length === 0}
          >
            Clear All
          </Button>
        </div>
        {conversations.map((conversation) => (
          <div key={conversation.id} className="flex items-center gap-2">
            <Button
              variant={selectedConversation === conversation.id ? 'default' : 'outline'}
              className="flex-1 justify-start text-left"
              onClick={() => handleConversationSelect(conversation.id)}
            >
              {conversation.title}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteConversation(conversation.id)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </Button>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        <Card className="flex-1 mb-4">
          <CardContent className="p-4 h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%] prose prose-sm dark:prose-invert",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <ReactMarkdown
                        components={{
                          code({ children }) {
                            return (
                              <code className="bg-muted-foreground/10 rounded px-1 py-0.5 border border-muted-foreground/30 px-2 py-1">
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>
        <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="flex-1 resize-none"
            rows={3}
            disabled={isLoading}
          />
          <Button
            type={isLoading ? "button" : "submit"}
            size="lg"
            variant={isLoading ? "destructive" : "default"}
            onClick={() => {
              if (isLoading) {
                stop()
              } else {
                formRef.current?.requestSubmit();
              }
            }}
          >
            {isLoading ? 'Stop' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
}