import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Stack, Divider, Chip, MenuList, MenuItem, ListItemText
} from '@mui/material';
import {
  Send as PaperAirplaneIcon, AttachFile as PaperClipIcon, Close as XMarkIcon,
  AutoAwesome as SparklesIcon, SwapHoriz as ArrowsRightLeftIcon, Schedule as ClockIcon,
  Upload as DocumentArrowUpIcon, Edit as PencilIcon, Info as InformationCircleIcon
} from '@mui/icons-material';
import { ProjectGroup, User, Advisor, LogEntry, FileUploadPayload } from '../types';
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
            return <ArrowsRightLeftIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />;
        }
        if (lowerMessage.includes('submitted')) {
            return <DocumentArrowUpIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />;
        }
        if (lowerMessage.includes('due date')) {
            return <ClockIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />;
        }
        if (lowerMessage.includes('updated') || lowerMessage.includes('registered')) {
            return <PencilIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />;
        }
        return <InformationCircleIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />;
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
                            <Chip
                                key={i}
                                label={`@${part}`}
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.75rem',
                                    bgcolor: isCurrentUserMentioned ? 'primary.dark' : 'primary.light',
                                    color: 'primary.contrastText',
                                    fontWeight: 600,
                                    mx: 0.25
                                }}
                            />
                        );
                    }
                    return <span key={i}>{part}</span>;
                })}
            </>
        );
    };

    return (
        <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
                <Typography variant="h6" fontWeight="bold">
                    {t('communicationLog')}
                </Typography>
                <Button
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                    startIcon={<SparklesIcon />}
                    size="small"
                    color="secondary"
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    {t('aiSummary')}
                </Button>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, mb: 2 }}>
                <Stack spacing={2}>
                    {(projectGroup.project.log || []).map(entry => {
                        if (entry.type === 'event') {
                            return (
                                <Box key={entry.id} sx={{ py: 1 }}>
                                    <Divider sx={{ display: 'flex', alignItems: 'center', '&::before, &::after': { flex: 1 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
                                            {getEventIcon(entry.message)}
                                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                {entry.message}
                                            </Typography>
                                            <Typography variant="caption" fontWeight="semibold" color="text.secondary">
                                                {' by '}{entry.authorName}
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled">
                                                ({formatTimeAgo(entry.timestamp, t)})
                                            </Typography>
                                        </Box>
                                    </Divider>
                                </Box>
                            );
                        }

                        const isCurrentUser = entry.authorId === user.id;
                        
                        return (
                            <Box key={entry.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: isCurrentUser ? 'flex-end' : 'flex-start' }}>
                                <Stack direction="row" spacing={1} alignItems="baseline" sx={{ order: isCurrentUser ? 2 : 1 }}>
                                    <Typography variant="caption" fontWeight="semibold" sx={{ order: isCurrentUser ? 2 : 1 }}>
                                        {entry.authorName} ({entry.authorRole})
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(entry.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                    </Typography>
                                </Stack>
                                <Paper
                                    elevation={1}
                                    sx={{
                                        mt: 0.5,
                                        p: 1.5,
                                        maxWidth: '28rem',
                                        bgcolor: isCurrentUser ? 'primary.main' : 'action.hover',
                                        color: isCurrentUser ? 'primary.contrastText' : 'text.primary'
                                    }}
                                >
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {renderMessage(entry.message)}
                                    </Typography>
                                    {entry.file && (
                                        <Divider sx={{ my: 1, borderColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : 'divider' }} />
                                        <Button
                                            component="a"
                                            href={getFileDataUrl(entry.file.fileId)}
                                            download={entry.file.name}
                                            startIcon={<PaperClipIcon />}
                                            size="small"
                                            sx={{
                                                textTransform: 'none',
                                                color: isCurrentUser ? 'inherit' : 'primary.main'
                                            }}
                                        >
                                            {entry.file.name}
                                        </Button>
                                    )}
                                </Paper>
                            </Box>
                        );
                    })}
                </Stack>
                <div ref={messagesEndRef} />
            </Box>
            <Box sx={{ position: 'relative', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
                {showMentions && filteredMembers.length > 0 && (
                    <Paper
                        elevation={8}
                        sx={{
                            position: 'absolute',
                            bottom: '100%',
                            mb: 1,
                            width: '100%',
                            maxWidth: 320,
                            maxHeight: 160,
                            overflowY: 'auto',
                            zIndex: 10
                        }}
                    >
                        <MenuList>
                            {filteredMembers.map((member, index) => (
                                <MenuItem
                                    key={member.id}
                                    onClick={() => insertMention(member.name)}
                                    selected={index === mentionIndex}
                                >
                                    <ListItemText primary={member.name} />
                                </MenuItem>
                            ))}
                        </MenuList>
                    </Paper>
                )}
                {attachment && (
                    <Box sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" noWrap sx={{ flexGrow: 1, mr: 1 }}>
                            {attachment.name}
                        </Typography>
                        <IconButton
                            onClick={() => { setAttachment(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                            size="small"
                            color="error"
                        >
                            <XMarkIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}
                <Stack direction="row" spacing={1} alignItems="center">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                    <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        size="small"
                    >
                        <PaperClipIcon />
                    </IconButton>
                    <TextField
                        inputRef={textareaRef}
                        multiline
                        rows={1}
                        value={message}
                        onChange={handleMessageChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message... Use @ to mention someone."
                        fullWidth
                        size="small"
                        sx={{ flexGrow: 1 }}
                    />
                    <IconButton
                        onClick={handleSend}
                        color="primary"
                        disabled={!message.trim() && !attachment}
                        sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}
                    >
                        <PaperAirplaneIcon />
                    </IconButton>
                </Stack>
            </Box>
        </Paper>
    )
};

export default CommunicationLog;