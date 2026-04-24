import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Send,
  Loader2,
  Trash2,
  Sparkles,
  Settings,
  Users,
  Activity,
  Calendar,
  FileText,
  Lightbulb,
  Lock,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useAIAssistant, Message } from '@/hooks/useAIAssistant';
import { PaywallDialog } from '@/components/billing/PaywallDialog';
import { useAICredits } from '@/hooks/useAICredits';
import { format } from 'date-fns';

const QUICK_PROMPTS = [
  { icon: Settings, label: 'Setup Guide', prompt: 'How do I set up the app for my rheumatology practice?' },
  { icon: Users, label: 'Patient Management', prompt: 'What are best practices for managing patient cards and tracking?' },
  { icon: Activity, label: 'Monitoring', prompt: 'How should I configure monitoring plans for different medications?' },
  { icon: Calendar, label: 'Infusions', prompt: 'Help me set up infusion scheduling and reminders' },
  { icon: FileText, label: 'Education', prompt: 'How can I create effective patient education content?' },
  { icon: Lightbulb, label: 'Improvements', prompt: 'What improvements would you suggest for my workflow?' },
];

export default function AIAssistant() {
  const { messages, isLoading, sendMessage, clearMessages, paywallOpen, setPaywallOpen } = useAIAssistant();
  const { credits, remainingFree, refresh: refreshCredits } = useAICredits();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (!isLoading) {
      sendMessage(prompt);
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-7 w-7 text-primary" />
              AI Config Assistant
            </h1>
            <p className="text-muted-foreground mt-1">
              Your intelligent helper for configuring and optimizing RheumaFlow
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => setPaywallOpen(true)}
              title="Comprar mais créditos via PIX"
            >
              <Sparkles className="h-3 w-3 mr-1 text-primary" />
              {credits ? `${credits.credits_balance} créditos · ${remainingFree} grátis` : '...'}
            </Badge>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearMessages}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Chat
              </Button>
            )}
          </div>
        </div>

        <PaywallDialog
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          onSuccess={refreshCredits}
        />

        {/* Main Chat Area */}
        <Card className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by AI
              </Badge>
              <span className="text-xs text-muted-foreground">
                Ask me anything about configuring your practice
              </span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <Bot className="h-16 w-16 text-primary/20 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">How can I help you today?</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    I can help you configure RheumaFlow, suggest workflow improvements,
                    explain features, and guide you through best practices.
                  </p>

                  {/* Quick prompts */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full max-w-lg">
                    {QUICK_PROMPTS.map((item) => (
                      <Button
                        key={item.label}
                        variant="outline"
                        size="sm"
                        className="h-auto py-3 px-3 flex flex-col items-start text-left"
                        onClick={() => handleQuickPrompt(item.prompt)}
                        disabled={isLoading}
                      >
                        <item.icon className="h-4 w-4 mb-1 text-primary" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 bg-primary/10">
                        <AvatarFallback>
                          <Bot className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-muted/30">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about configuration, features, or best practices..."
                  className="min-h-[44px] max-h-[120px] resize-none"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      <Avatar className={cn('h-8 w-8', isUser ? 'bg-secondary' : 'bg-primary/10')}>
        <AvatarFallback>
          {isUser ? 'U' : <Bot className="h-4 w-4 text-primary" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex flex-col max-w-[80%]', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted prose prose-sm dark:prose-invert max-w-none'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                code: ({ children }) => (
                  <code className="bg-background/50 px-1 py-0.5 rounded text-xs">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-background/50 p-2 rounded text-xs overflow-x-auto mb-2">
                    {children}
                  </pre>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {format(message.timestamp, 'HH:mm')}
        </span>
      </div>
    </div>
  );
}
