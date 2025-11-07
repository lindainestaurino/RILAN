import React, { useState, useRef, useEffect } from 'react';
import { apiGetAiChatResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RilanLogoIcon, SparklesIcon, UserIcon } from '../components/icons/Icons';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AiChatPage: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: 'Olá! Sou a Rilan AI, sua assistente de estoque. Como posso ajudar hoje?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await apiGetAiChatResponse(input);
            const aiMessage: Message = { sender: 'ai', text: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Failed to get AI response", error);
            const errorMessage: Message = { sender: 'ai', text: "Desculpe, ocorreu um erro. Tente novamente mais tarde." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-100px)]">
            <h1 className="text-3xl font-bold text-white mb-4 flex items-center">
                <SparklesIcon className="h-8 w-8 mr-3 text-fuchsia-400"/>
                Chat IA
            </h1>
            
            <div className="flex-1 bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                             {msg.sender === 'ai' && <RilanLogoIcon className="h-8 w-8 flex-shrink-0 mt-1" />}
                            <div className={`max-w-xl p-4 rounded-xl ${msg.sender === 'user' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                             {msg.sender === 'user' && <UserIcon className="h-8 w-8 text-slate-400 p-1 bg-slate-700 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-start gap-4">
                            <RilanLogoIcon className="h-8 w-8 flex-shrink-0 mt-1" />
                            <div className="max-w-xl p-4 rounded-xl bg-slate-700 text-slate-200">
                                <div className="flex items-center space-x-2">
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 bg-slate-800 border-t border-slate-700">
                    <form onSubmit={handleSubmit} className="flex gap-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pergunte sobre o estoque..."
                            className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition disabled:bg-slate-500 disabled:cursor-not-allowed"
                        >
                            Enviar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AiChatPage;
