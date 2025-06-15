import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Clock } from 'lucide-react';

interface ChatMessage {
  id: string;
  messageType: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  processingTime?: number;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  currentMessage: string;
  isActive: boolean;
  isLoading: boolean;
  onCurrentMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export function ChatInterface({
  messages,
  currentMessage,
  isActive,
  isLoading,
  onCurrentMessageChange,
  onSendMessage,
  onKeyPress,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat Simulator
          </CardTitle>
          <CardDescription>
            {isActive ? (
              <Badge variant="default" className="w-fit">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live Session
                </div>
              </Badge>
            ) : (
              <Badge variant="secondary">Stopped</Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          <ScrollArea className="h-96 w-full rounded border p-4 mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.messageType === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.messageType === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.messageType === 'system'
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {message.timestamp.toLocaleTimeString()}
                      {message.processingTime && (
                        <span>({message.processingTime}ms)</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          {isActive && (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={currentMessage}
                onChange={(e) => onCurrentMessageChange(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={onSendMessage} 
                disabled={!currentMessage.trim() || isLoading}
                size="sm"
              >
                Send
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 