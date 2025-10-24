import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ProjectGroup, User, Advisor, LogEntry, FileUploadPayload } from '../types';
import { PaperAirplaneIcon, PaperClipIcon, XMarkIcon, SparklesIcon, ArrowsRightLeftIcon, ClockIcon, DocumentArrowUpIcon, PencilIcon, InformationCircleIcon } from './icons';
import { useToast } from '../hooks/useToast';
import { formatTimeAgo } from '../utils/timeUtils';
import { useTranslations } from '../hooks/useTranslations';

interface CommunicationLogProps {
    projectGroup: ProjectGroup;
    user: User;
    advisors: Advisor[];
    onAddEntry: (projectId: string, entry: Omit<LogEntry, 'id' | 'timestamp' | 'file'>, filePayload?: FileUploadPayload | null) => void;
    onAnalyze: () => void;
}

const getFileDataUrl = (fileId: string): string => {
    try {
        return localStorage.getItem(`file_${fileId}`) || '';
    } catch (error) {
        console.error('Error reading file from localStorage:', error);
        return '';
    }
};

const CommunicationLog: React.FC<CommunicationLogProps> = ({ projectGroup, user, advisors, onAddEntry, onAnalyze }) => {
    const [message, setMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionIndex, setMentionIndex] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const addToast = useToast();
    const t = useTranslations();
    const [isAnalyzing, setIsAnalyzing] = useState(false); // Added for local button state, though parent controls logic

    const getEventIcon = (message: string) => {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('status changed') || lowerMessage.includes('approved') || lowerMessage.includes('rejected') || lowerMessage.includes('transferred')) {
            return <ArrowsRightLeftIcon className="w-3 h-3 mr-1.5 inline-block" />;
        }
        if (lowerMessage.includes('submitted')) {
            return <DocumentArrowUpIcon className="w-3 h-3 mr-1.5 inline-block" />;
        }
        if (lowerMessage.includes('due date')) {
            return <ClockIcon className="w-3 h-3 mr-1.5 inline-block" />;
        }
        if (lowerMessage.includes('updated') || lowerMessage.includes('registered')) {
            return <PencilIcon className="w-3 h-3 mr-1.5 inline-block" />;
        }
        return <InformationCircleIcon className="w-3 h-3 mr-1.5 inline-block" />;
    };

    const projectMembers = useMemo(() => {
        const advisor = advisors.find(a => a.name === projectGroup.project.advisorName);
        const members = projectGroup.students.map(s => ({ id: s.studentId, name: `${s.name} ${s.surname}` }));
        if (advisor) {
            members.push({ id: advisor.id, name: advisor.name });
        }
        return members.filter(m => m.id !== user.id); // Can't mention yourself
    }, [projectGroup, advisors, user.id]);
    
    const filteredMembers = useMemo(() => 
        projectMembers.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    , [projectMembers, mentionQuery]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [projectGroup.project.log]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                addToast({ type: 'error', message: 'File size cannot exceed 5MB.' });
                return;
            }
            setAttachment(file);
        }
    };
    
    const insertMention = (name: string) => {
        if (!textareaRef.current) return;
        const currentMessage = textareaRef.current.value;
        const lastAt = currentMessage.lastIndexOf('@');
        if (lastAt !== -1) {
            const newMessage = `${currentMessage.substring(0, lastAt)}@${name} `;
            setMessage(newMessage);
        }
        setShowMentions(false);
        setMentionQuery('');
        textareaRef.current.focus();
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setMessage(text);

        const lastAt = text.lastIndexOf('@');
        if (lastAt !== -1 && text.substring(lastAt + 1).match(/^\S*$/)) { // Check if there are no spaces after @
            setMentionQuery(text.substring(lastAt + 1));
            setShowMentions(true);
            setMentionIndex(0);
        } else {
            setShowMentions(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showMentions && filteredMembers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex(prev => (prev + 1) % filteredMembers.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                insertMention(filteredMembers[mentionIndex].name);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowMentions(false);
            }
        }
    };


    const handleSend = () => {
        if (!message.trim() && !attachment) return;

        const entryData: Omit<LogEntry, 'id' | 'timestamp' | 'file'> = {
            authorId: user.id,
            authorName: user.name,
            authorRole: user.role,
            message: message.trim(),
            type: 'message',
        };

        if (attachment) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                if (dataUrl) {
                    const filePayload: FileUploadPayload = {
                        name: attachment.name,
                        type: attachment.type,
                        size: attachment.size,
                        dataUrl,
                    };
                    onAddEntry(projectGroup.project.projectId, entryData, filePayload);
                }
            };
            reader.readAsDataURL(attachment);
        } else {
            onAddEntry(projectGroup.project.projectId, entryData, null);
        }

        setMessage('');
        setAttachment(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const renderMessage = (text: string) => {
        const mentionRegex = /@([\w\s.]+)/g;
        const parts = text.split(mentionRegex);
        return (
            <>
                {parts.map((part, i) => {
                    if (i % 2 === 1) { // This is a mentioned name
                        const isCurrentUserMentioned = part === user.name;
                        return (
                            <strong key={i} className={isCurrentUserMentioned ? 'text-blue-400 bg-blue-900/50 px-1 rounded' : 'text-blue-400'}>
                                @{part}
                            </strong>
                        );
                    }
                    return part;
                })}
            </>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col h-[70vh]">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('communicationLog')}</h3>
                 <button onClick={onAnalyze} disabled={isAnalyzing} className="flex items-center text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 disabled:opacity-50">
                    <SparklesIcon className="w-5 h-5 mr-1.5" />
                    {t('aiSummary')}
                </button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {(projectGroup.project.log || []).map(entry => {
                    if (entry.type === 'event') {
                        return (
                            <div key={entry.id} className="py-2">
                                <div className="flex items-center">
                                    <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                    <div className="flex-shrink-0 mx-4 text-xs text-slate-500 dark:text-slate-400 flex items-center">
                                        {getEventIcon(entry.message)}
                                        <span>
                                            <span className="italic">{entry.message}</span>
                                            <span className="font-semibold"> by {entry.authorName}</span>
                                            <span className="ml-1 text-slate-400">({formatTimeAgo(entry.timestamp, t)})</span>
                                        </span>
                                    </div>
                                    <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                </div>
                            </div>
                        )
                    }

                    const isCurrentUser = entry.authorId === user.id;
                    const alignClass = isCurrentUser ? 'items-end' : 'items-start';
                    const bubbleClass = isCurrentUser 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
                    
                    return (
                        <div key={entry.id} className={`flex flex-col ${alignClass}`}>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-xs font-semibold ${isCurrentUser ? 'order-2' : ''}`}>{entry.authorName} ({entry.authorRole})</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(entry.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short'})}</span>
                            </div>
                            <div className={`mt-1 p-3 rounded-lg max-w-lg ${bubbleClass}`}>
                                <p className="text-sm whitespace-pre-wrap">{renderMessage(entry.message)}</p>
                                {entry.file && (
                                    <div className="mt-2 pt-2 border-t border-white/20 dark:border-slate-600/50">
                                        <a 
                                            href={getFileDataUrl(entry.file.fileId)} 
                                            download={entry.file.name}
                                            className="flex items-center gap-2 text-sm font-medium hover:underline"
                                        >
                                            <PaperClipIcon className="w-4 h-4" />
                                            {entry.file.name}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="relative mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                 {showMentions && filteredMembers.length > 0 && (
                    <div className="absolute bottom-full mb-2 w-full max-w-xs bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                        <ul>
                            {filteredMembers.map((member, index) => (
                                <li key={member.id}>
                                    <button 
                                        onClick={() => insertMention(member.name)}
                                        className={`w-full text-left px-3 py-2 text-sm ${index === mentionIndex ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                                    >
                                        {member.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                 )}
                {attachment && (
                    <div className="mb-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-md flex justify-between items-center text-sm">
                        <span className="truncate">{attachment.name}</span>
                        <button onClick={() => { setAttachment(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                            <XMarkIcon className="w-4 h-4"/>
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                        <PaperClipIcon className="w-5 h-5"/>
                    </button>
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={message}
                        onChange={handleMessageChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message... Use @ to mention someone."
                        className="block w-full rounded-md border-0 p-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-slate-700 dark:text-white dark:ring-slate-600 resize-none"
                    />
                    <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-lg">
                        <PaperAirplaneIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    )
};

export default CommunicationLog;