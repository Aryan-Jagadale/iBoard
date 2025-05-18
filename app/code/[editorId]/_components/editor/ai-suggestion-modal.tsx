
import React, { useEffect, useMemo, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-jsx';
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from "@/components/ui/scroll-area";

interface AiSuggestionModalProps {
    isOpen: boolean
    onClose: () => void
    suggestion: string
    onAccept: (code:any) => void
    onReject: () => void
}

export function AiSuggestionModal({ isOpen, onClose, suggestion, onAccept, onReject }: AiSuggestionModalProps) {
    const [copied, setCopied] = useState(false);

    // Parse content into text and code parts
    const { parts, codeContent } = useMemo(() => {
        if (!suggestion) {
            return { parts: [], codeContent: null };
        }

        // Split suggestion into parts: text or code blocks
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const parts: { type: 'text' | 'code'; content: string; language?: string }[] = [];
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(suggestion)) !== null) {
            // Add text before the code block
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: suggestion.slice(lastIndex, match.index) });
            }
            // Add code block
            const code = match[2];
            const language = match[1] || 'jsx';
            parts.push({ type: 'code', content: code, language });
            lastIndex = codeBlockRegex.lastIndex;
        }

        // Add remaining text
        if (lastIndex < suggestion.length) {
            parts.push({ type: 'text', content: suggestion.slice(lastIndex) });
        }

        // Extract code content for copying
        const codeContent = parts
            .filter((part) => part.type === 'code')
            .map((part) => part.content)
            .join('\n');

        return { parts, codeContent: codeContent || null };
    }, [suggestion]);

    // Highlight code
    useEffect(() => {
        if (parts.some((part) => part.type === 'code')) {
            Prism.highlightAll();
        }
    }, [parts]);

    // Handle Escape key
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    // Copy code to clipboard
    const copyToClipboard = () => {
        if (codeContent) {
            navigator.clipboard.writeText(codeContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen || !suggestion) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl h-full sm:h-auto overflow-scroll">
                <DialogHeader>
                    <DialogTitle>AI Suggestion</DialogTitle>
                    <DialogDescription>Review the AI-generated suggestion below.</DialogDescription>
                </DialogHeader>

<ScrollArea className="h-[60vh] sm:h-[70vh]">
     <div className="mt-4 space-y-4">
                    {parts.map((part, index) => (
                        <div key={index} className="relative">
                            {part.type === 'code' ? (
                                <div className="rounded-md border bg-slate-950 p-4">
                                    <div className="absolute right-3 top-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 bg-slate-800 hover:bg-slate-700"
                                            onClick={copyToClipboard}
                                            aria-label="Copy code"
                                        >
                                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-400" />}
                                        </Button>
                                    </div>
                                    <div className="max-h-[60vh] overflow-auto">
                                        <pre className={cn('text-sm font-mono text-slate-50', `language-${part.language}`)}>
                                            <code>{part.content}</code>
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="prose text-gray-400">
                                    <ReactMarkdown>{part.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
 </ScrollArea>
               

                <DialogFooter className="flex sm:justify-between">
                    <Button variant="destructive" onClick={onReject}>
                        Reject
                    </Button>
                    <Button onClick={()=>onAccept(codeContent)}>Accept</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
