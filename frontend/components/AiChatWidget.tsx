import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { XMarkIcon, PaperAirplaneIcon, SparklesIcon } from './icons';
import { User, ProjectGroup, Advisor, Student } from '../types';

interface AiChatWidgetProps {
  user: User;
  onClose: () => void;
  studentProjectGroup: ProjectGroup | null;
  allProjects: ProjectGroup[];
  allAdvisors: Advisor[];
  allStudents: Student[];
}

interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
}

const AiChatWidget: React.FC<AiChatWidgetProps> = ({ user, onClose, studentProjectGroup, allProjects, allAdvisors, allStudents }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
      if (inputRef.current) {
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      }
  }, [input]);

  const initializeChat = useCallback(() => {
      if (!process.env.API_KEY) {
          setMessages([{ role: 'system', text: "AI Assistant is not configured. Missing API key." }]);
          return;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let systemInstruction = `You are Projo, a helpful and friendly AI assistant for a university's final project management system. You are an expert on the academic process. Be concise and clear in your answers. Today's date is ${new Date().toLocaleDateString()}.`;

      if (user.role === 'Student') {
          const studentData = allStudents.find(s => s.studentId === user.id);
          systemInstruction += ` You are talking to ${user.name}, a student majoring in ${studentData?.major}.`;
          if (studentProjectGroup) {
              const project = studentProjectGroup.project;
              const milestoneSummary = project.milestones?.map(m => `- ${m.name}: ${m.status} (Due: ${new Date(m.dueDate).toLocaleDateString()})`).join('\n') || 'No milestones.';
              systemInstruction += ` Their current project is "${project.topicEng}". Their advisor is ${project.advisorName}. Here is their milestone progress:\n${milestoneSummary}`;
          } else {
               systemInstruction += ` The student has not registered a project yet. You can help them with topic ideas.`;
          }
      } else if (user.role === 'Advisor') {
          const projectsSupervising = allProjects.filter(p => p.project.advisorName === user.name).length;
          systemInstruction += ` You are talking to ${user.name}, an advisor. They are currently supervising ${projectsSupervising} projects.`;
      } else if (user.role === 'Admin' || user.role === 'DepartmentAdmin') {
          const pendingProjects = allProjects.filter(p => p.project.status === 'Pending').length;
          const pendingStudents = allStudents.filter(s => s.status === 'Pending').length;
          systemInstruction += ` You are talking to an administrator named ${user.name}. Here is a system overview:
- Total Projects: ${allProjects.length} (${pendingProjects} pending approval)
- Total Students: ${allStudents.length} (${pendingStudents} pending registration)
- Total Advisors: ${allAdvisors.length}`;
      }

      const newChat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: { systemInstruction },
      });
      setChat(newChat);
      setMessages([{ role: 'model', text: `Hello ${user.name}! I'm Projo, your AI assistant. How can I help you today?` }]);
  }, [user, studentProjectGroup, allProjects, allStudents, allAdvisors]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chat) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const responseStream = await chat.sendMessageStream({ message: input });
        
        let modelResponse = '';
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        for await (const chunk of responseStream) {
            modelResponse += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].text = modelResponse;
                return newMessages;
            });
        }
    } catch (error) {
        console.error("Gemini API error:", error);
        setMessages(prev => [...prev, { role: 'system', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 w-[calc(100%-3rem)] sm:w-96 h-[70vh] sm:h-[600px] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in-up">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-3">
                <SparklesIcon className="w-6 h-6 text-purple-500"/>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">AI Assistant</h3>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" aria-label="Close chat">
                <XMarkIcon className="w-6 h-6"/>
            </button>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'system' ? (
                         <div className="text-center w-full text-xs text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-2 rounded-md">{msg.text}</div>
                    ) : (
                        <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                           <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br />') }}></div>
                        </div>
                    )}
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-700 rounded-bl-none flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                    placeholder="Ask me anything..."
                    disabled={!chat || isLoading}
                    rows={1}
                    className="block w-full rounded-lg border-0 p-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600 resize-none"
                />
                <button type="submit" disabled={!chat || isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-lg disabled:bg-slate-400 disabled:cursor-not-allowed">
                    <PaperAirplaneIcon className="w-5 h-5"/>
                </button>
            </div>
        </form>
    </div>
  );
};

export default AiChatWidget;