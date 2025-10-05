'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Lightbulb, AlertCircle } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from '@/components/ui/use-toast';
import type { Placeholder } from '@/types/template';

interface AIAssistantProps {
  templateId: string;
  placeholders: Placeholder[];
  onSuggestionApply: (suggestion: Placeholder) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: Placeholder[];
}

export default function AIAssistant({
  templateId,
  placeholders,
  onSuggestionApply,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I can help you with:\n• Suggesting missing placeholders\n• Improving field descriptions\n• Validating your placeholder schema\n\nWhat would you like help with?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const functions = getFunctions();

  const detectMissingFields = async () => {
    try {
      setLoading(true);
      const detect = httpsCallable(functions, 'detectPlaceholders');
      const result: any = await detect({ templateId });

      if (result.data.success) {
        const detected = result.data.data.placeholders || [];
        const existing = placeholders.map((p) => p.field_key);
        const missing = detected.filter((p: Placeholder) => !existing.includes(p.field_key));

        if (missing.length > 0) {
          setMessages([
            ...messages,
            {
              role: 'assistant',
              content: `I found ${missing.length} potential placeholder(s) that aren't in your current schema:`,
              suggestions: missing,
            },
          ]);
        } else {
          setMessages([
            ...messages,
            {
              role: 'assistant',
              content: 'Great! Your schema looks complete. I didn\'t find any missing placeholders.',
            },
          ]);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to detect placeholders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateSchema = async () => {
    try {
      setLoading(true);
      const validate = httpsCallable(functions, 'validateTemplateSchema');
      const result: any = await validate({ templateId, placeholders });

      if (result.data.success) {
        const issues = result.data.data.issues || [];
        if (issues.length === 0) {
          setMessages([
            ...messages,
            {
              role: 'assistant',
              content: '✓ Your placeholder schema is valid! No issues found.',
            },
          ]);
        } else {
          setMessages([
            ...messages,
            {
              role: 'assistant',
              content: `I found ${issues.length} issue(s) with your schema:\n\n${issues.map((issue: any) => `• ${issue.field}: ${issue.message}`).join('\n')}`,
            },
          ]);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to validate schema',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages([...messages, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Simple command routing
      if (userMessage.toLowerCase().includes('detect') || userMessage.toLowerCase().includes('missing')) {
        await detectMissingFields();
      } else if (userMessage.toLowerCase().includes('validate') || userMessage.toLowerCase().includes('check')) {
        await validateSchema();
      } else {
        // Generic AI response
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'I can help you with:\n• "detect missing fields" - Find placeholders not in your schema\n• "validate schema" - Check for issues in your current placeholders\n• Ask specific questions about field types or structure',
          },
        ]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process message',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span>AI Assistant</span>
        </CardTitle>
        <CardDescription>
          Get intelligent suggestions and validation for your template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <Button onClick={detectMissingFields} size="sm" variant="outline" disabled={loading}>
            <Lightbulb className="w-4 h-4 mr-2" />
            Detect Missing Fields
          </Button>
          <Button onClick={validateSchema} size="sm" variant="outline" disabled={loading}>
            <AlertCircle className="w-4 h-4 mr-2" />
            Validate Schema
          </Button>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="h-[400px] border rounded-lg p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.suggestions.map((suggestion, i) => (
                        <div key={i} className="bg-white rounded p-3 border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-gray-900">
                                  {suggestion.label}
                                </span>
                                <Badge className="bg-blue-100 text-blue-800">
                                  {suggestion.type}
                                </Badge>
                              </div>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                                {suggestion.field_key}
                              </code>
                              {suggestion.description && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {suggestion.description}
                                </p>
                              )}
                            </div>
                            <Button
                              onClick={() => onSuggestionApply(suggestion)}
                              size="sm"
                              className="ml-2"
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask me anything about your template..."
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
