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

function ChatPanel({ messages, input, handleInputChange, handleSubmit, isLoading, stop, formRef, messagesEndRef }: {
  messages: any[],
  input: string,
  handleInputChange: any,
  handleSubmit: any,
  isLoading: boolean,
  stop: any,
  formRef: React.RefObject<HTMLFormElement>,
  messagesEndRef: React.RefObject<HTMLDivElement>,
}) {
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }
  };

  return (
    <Card className="flex-1 mb-6 rounded-2xl shadow-2xl border-0 bg-white/90 backdrop-blur-md">
      <CardContent className="p-6 h-[80vh] overflow-y-auto">
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-500 animate-fade-in">
              <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-500 to-blue-400 bg-clip-text text-transparent">Welcome to Simple Chat</div>
              <div className="text-lg mb-4">Start a new conversation or select one from the left.<br/>Type your message below to begin chatting!</div>
              <div className="flex items-center gap-2 text-base text-gray-400">
                <span>💡</span>
                <span>Press <b>Enter</b> to send, <b>Shift+Enter</b> for a new line.</span>
              </div>
            </div>
          )}
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
                  "rounded-2xl px-5 py-3 shadow-md text-base font-medium transition-all",
                  message.role === 'user'
                    ? "bg-gradient-to-r from-blue-500 to-indigo-400 text-white animate-fade-in-right"
                    : "bg-gray-100 text-gray-800 animate-fade-in-left"
                )}
              >
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                ) : (
                  <div className="prose max-w-none dark:prose-invert markdown-custom">
                    <ReactMarkdown
                      components={{
                        code({ children }) {
                          return (
                            <div>
                              {children}
                            </div>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <form ref={formRef} onSubmit={handleSubmit} className="flex gap-3 mt-2 px-10 pb-7">
        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          className="flex-1 resize-none rounded-xl border-2 border-gray-200 shadow focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white/80 text-gray-800"
          rows={3}
          disabled={isLoading}
        />
        <Button
          type={isLoading ? "button" : "submit"}
          size="lg"
          variant={isLoading ? "destructive" : "default"}
          className="rounded-xl px-6 py-2 text-lg font-semibold shadow-lg bg-gradient-to-r from-indigo-500 to-blue-400 text-white hover:from-blue-500 hover:to-indigo-400 transition-all duration-200"
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
    </Card>
  );
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
  } = useChat({
    api: '/api/agent',
    body: { conversationId },
    onFinish: fetchConversations,
  });

  async function fetchConversations() {
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

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!conversations.length) {
      setMessages([])
    }
  }, [conversations])

  const handleConversationSelect = async (conversationId: number) => {
    setSelectedConversation(conversationId);
    setConversationId(conversationId.toString());
    setChatKey(prev => prev + 1);
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId }),
    });
    if (response.ok) {
      const historyMessages = await response.json();
      setMessages(historyMessages);
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
        setMessages([])
      }
    } catch (error) {
      console.error('Error clearing conversations:', error);
    }
  };

  return (
    <div className="flex h-screen max-w-6xl mx-auto p-8 gap-8 bg-gradient-to-br from-[#f8fafc] via-[#e0e7ef] to-[#c7d2fe] min-h-screen">
      <div className="w-72 flex flex-col gap-4 bg-white/80 rounded-2xl shadow-xl p-4 backdrop-blur-md border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 tracking-wide">Conversations</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg shadow hover:scale-105 transition-all"
              onClick={() => {
                setSelectedConversation(null);
                setConversationId(null);
                setChatKey(prev => prev + 1);
              }}
            >
              New
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-lg shadow hover:scale-105 transition-all"
              onClick={handleClearAllConversations}
              disabled={conversations.length === 0}
            >
              Clear All
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] pr-1">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="flex items-center gap-2 group">
              <Button
                variant={selectedConversation === conversation.id ? 'default' : 'outline'}
                className={`flex-1 justify-start text-left rounded-lg font-medium transition-all shadow-sm ${selectedConversation === conversation.id ? 'bg-gradient-to-r from-indigo-500 to-blue-400 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
                onClick={() => handleConversationSelect(conversation.id)}
              >
                {conversation.title}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-red-100 transition-all"
                onClick={() => handleDeleteConversation(conversation.id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400 group-hover:text-red-500 transition-colors"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <ChatPanel
          key={chatKey}
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
          formRef={formRef}
          messagesEndRef={messagesEndRef}
        />
      </div>
    </div>
  );
}