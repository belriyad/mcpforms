'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Send, Copy, RefreshCw } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface AIClauseGeneratorProps {
  customerId: string;
  serviceId: string;
  onClauseGenerated: (override: any) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  generatedClause?: string;
}

export default function AIClauseGenerator({
  customerId,
  serviceId,
  onClauseGenerated,
}: AIClauseGeneratorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hi! I can help you generate custom clauses for your intake form. Just describe what you need, and I\'ll draft it for you.\n\nFor example:\n• "Add a confidentiality clause"\n• "Create a payment terms section"\n• "Draft a cancellation policy"',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastGeneratedClause, setLastGeneratedClause] = useState<string | null>(null);
  const { toast } = useToast();

  const generateClause = async (prompt: string) => {
    try {
      setLoading(true);
      const functions = getFunctions();

      const generate = httpsCallable(functions, 'generateCustomClause');
      const result: any = await generate({
        customerId,
        serviceId,
        prompt,
        context: {
          existingClauses: messages
            .filter((m) => m.generatedClause)
            .map((m) => m.generatedClause),
        },
      });

      if (result.data.success) {
        const generatedText = result.data.data.text;
        setLastGeneratedClause(generatedText);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Here\'s your custom clause:',
            generatedClause: generatedText,
          },
        ]);

        toast({
          title: 'Clause Generated',
          description: 'Review and add it to your form',
        });
      } else {
        throw new Error(result.data.error || 'Generation failed');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate clause',
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

    await generateClause(userMessage);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Clause copied to clipboard',
    });
  };

  const addClauseToForm = async (clauseText: string) => {
    try {
      const functions = getFunctions();
      const createOverride = httpsCallable(functions, 'createCustomerOverride');
      const result: any = await createOverride({
        customerId,
        serviceId,
        override_type: 'custom_clause',
        custom_clause: {
          text: clauseText,
          position: 'end',
        },
      });

      if (result.data.success) {
        toast({
          title: 'Clause Added',
          description: 'Custom clause submitted for approval',
        });
        onClauseGenerated(result.data.data);
      } else {
        throw new Error(result.data.error || 'Failed to add clause');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add clause',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span>AI Clause Generator</span>
        </CardTitle>
        <CardDescription>
          Generate custom clauses using AI based on your requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <ScrollArea className="h-[450px] border rounded-lg p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {message.generatedClause && (
                    <div className="mt-3 bg-white rounded p-4 border border-gray-200">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap mb-3">
                        {message.generatedClause}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => copyToClipboard(message.generatedClause!)}
                          size="sm"
                          variant="outline"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          onClick={() => addClauseToForm(message.generatedClause!)}
                          size="sm"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Add to Form
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <p className="text-sm text-gray-500">Generating...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="space-y-2">
          <Label>Describe the clause you need</Label>
          <div className="flex items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="e.g., Add a confidentiality clause..."
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Suggestions */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Quick suggestions:</span>
          {['Confidentiality clause', 'Payment terms', 'Cancellation policy'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setInput(suggestion);
              }}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
