import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import {
  Box, Paper, Typography, TextField, IconButton, Stack, Alert, CircularProgress
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon, AutoAwesome as SparklesIcon } from '@mui/icons-material';
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
    <Paper
      elevation={24}
      sx={{
        position: 'fixed',
        bottom: { xs: 24, sm: 32 },
        right: { xs: 24, sm: 32 },
        zIndex: 1300,
        width: { xs: 'calc(100% - 3rem)', sm: 384 },
        height: { xs: '70vh', sm: 600 },
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          flexShrink: 0
        }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
                <SparklesIcon sx={{ fontSize: 24, color: 'secondary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                    AI Assistant
                </Typography>
            </Stack>
            <IconButton 
              onClick={onClose} 
              size="small"
              aria-label="Close chat"
            >
                <CloseIcon />
            </IconButton>
        </Box>

        {/* Messages */}
        <Box sx={{ 
          flexGrow: 1, 
          p: 2, 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
            {messages.map((msg, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' 
                  }}
                >
                    {msg.role === 'system' ? (
                         <Alert severity="error" sx={{ width: '100%', fontSize: '0.75rem', py: 0.5 }}>
                           {msg.text}
                         </Alert>
                    ) : (
                        <Paper
                          elevation={2}
                          sx={{
                            p: 1.5,
                            borderRadius: 3,
                            maxWidth: '85%',
                            fontSize: '0.875rem',
                            ...(msg.role === 'user' 
                              ? { 
                                  bgcolor: 'primary.main', 
                                  color: 'primary.contrastText',
                                  borderBottomRightRadius: 0
                                }
                              : { 
                                  bgcolor: 'action.hover', 
                                  color: 'text.primary',
                                  borderBottomLeftRadius: 0
                                }
                            )
                          }}
                        >
                           <Typography 
                             variant="body2"
                             component="div"
                             dangerouslySetInnerHTML={{ 
                               __html: msg.text
                                 .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                 .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                 .replace(/\n/g, '<br />') 
                             }} 
                           />
                        </Paper>
                    )}
                </Box>
            ))}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        borderBottomLeftRadius: 0,
                        bgcolor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: 'text.secondary',
                          animation: 'pulse 1.4s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.3 }
                          }
                        }} />
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: 'text.secondary',
                          animation: 'pulse 1.4s ease-in-out infinite 0.2s',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.3 }
                          }
                        }} />
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: 'text.secondary',
                          animation: 'pulse 1.4s ease-in-out infinite 0.4s',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.3 }
                          }
                        }} />
                    </Paper>
                </Box>
            )}
            <div ref={messagesEndRef} />
        </Box>

        {/* Input Form */}
        <Box 
          component="form" 
          onSubmit={handleSend}
          sx={{ 
            p: 2, 
            borderTop: 1, 
            borderColor: 'divider',
            flexShrink: 0
          }}
        >
            <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                    inputRef={inputRef}
                    fullWidth
                    multiline
                    maxRows={4}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      if (inputRef.current) {
                        inputRef.current.style.height = 'auto';
                        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
                      }
                    }}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder="Ask me anything..."
                    disabled={!chat || isLoading}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem'
                      }
                    }}
                />
                <IconButton
                    type="submit"
                    color="primary"
                    disabled={!chat || isLoading || !input.trim()}
                    sx={{ 
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'action.disabledBackground',
                        color: 'action.disabled'
                      }
                    }}
                >
                    <SendIcon />
                </IconButton>
            </Stack>
        </Box>
    </Paper>
  );
};

export default AiChatWidget;