import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Send, User, Bot, Loader2, RefreshCw } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { 
  UserProfile, 
  Product, 
  Material, 
  Employee, 
  Machine, 
  Credit 
} from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function Chat() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContext();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadContext = async () => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    
    const fetchCol = async (name: string) => {
      const snapshot = await getDocs(collection(db, 'users', userId, name));
      return snapshot.docs.map(doc => doc.data());
    };

    const [profileDoc, products, materials, employees, machines, credits] = await Promise.all([
      getDoc(doc(db, 'users', userId)),
      fetchCol('products'),
      fetchCol('materials'),
      fetchCol('employees'),
      fetchCol('machines'),
      fetchCol('credits'),
    ]);

    const profile = profileDoc.data() as UserProfile;
    
    const contextData = `
      Business Name: ${profile?.projectName || 'N/A'}
      Description: ${profile?.projectDescription || 'N/A'}
      Products: ${JSON.stringify(products)}
      Materials/Expenses: ${JSON.stringify(materials)}
      Employees: ${JSON.stringify(employees)}
      Machines: ${JSON.stringify(machines)}
      Credits/Debts: ${JSON.stringify(credits)}
    `;
    setContext(contextData);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const systemPrompt = `
        You are Harbouq, a brilliant financial and business advisor for small businesses.
        You speak Arabic and English fluently. Respond in the language used by the user.
        Your goal is to provide precise financial advice and pointers based on the provided business context.
        
        Business Context:
        ${context}
        
        Guidelines:
        - Analyze profitability (Price vs Cost).
        - Warn about aging debts or high burn rates.
        - Suggest pricing improvements or cost-cutting measures.
        - Be professional, encouraging, and highly analytical.
        - If data is missing, ask for it politely.
        - Focus on actionable advice for a small business owner.
      `;

      // Use the correct SDK pattern from the skill
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...messages.map(m => ({ 
            role: m.role === 'assistant' ? 'model' : 'user', 
            parts: [{ text: m.content }] 
          })),
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${userMessage}` }] }
        ]
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || 'I am sorry, I could not process that request.' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'There was an error connecting to the intelligence core. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col text-white">
      <header className="mb-8 border-b border-white/10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter font-serif">AI Advisor</h1>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">High-Fidelity Strategic Insights</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={loadContext} className="p-2 hover:bg-white/5 rounded-full transition-all" title="Reload Context">
             <RefreshCw size={16} className="opacity-50" />
          </button>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] uppercase font-bold opacity-30">Live Intelligence</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-4 space-y-6 mb-6 no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
            <Bot size={48} strokeWidth={1} />
            <p className="font-serif italic text-xl">"How can I optimize your cash flow today?"</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
            <div className={cn(
              "max-w-[80%] p-6",
              m.role === 'user' 
                ? "glass bg-white/5 rounded-2xl rounded-tr-none border-white/10" 
                : "glass-dark bg-indigo-500/10 rounded-2xl rounded-tl-none border-indigo-500/20"
            )}>
              <div className="flex items-center gap-2 mb-3 opacity-30">
                {m.role === 'user' ? <User size={12} /> : <Bot size={12} className="text-indigo-400" />}
                <span className="text-[8px] uppercase font-black tracking-widest">{m.role === 'user' ? 'Direct Input' : 'AI Analysis'}</span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-indigo-300">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-4">
            <div className="glass-dark px-6 py-4 rounded-2xl rounded-tl-none border-indigo-500/10 flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-indigo-400" />
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-30">Synthesizing Strategy...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="relative group">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
        <div className="relative glass p-2 flex gap-2 border-white/20 focus-within:border-indigo-500/50 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query the system..."
            className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-sm placeholder:text-white/20 text-white"
          />
          <button 
            disabled={loading || !input.trim()}
            className="bg-white text-indigo-950 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-30 flex items-center gap-2"
          >
            <Send size={16} />
            Analyze
          </button>
        </div>
      </form>
    </div>
  );
}
