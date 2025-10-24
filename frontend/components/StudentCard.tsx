import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Chip, 
  Box, 
  IconButton, 
  Checkbox,
  Switch,
  Stack,
  Divider
} from '@mui/material';
import { 
  Edit as PencilIcon, 
  Delete as TrashIcon, 
  CheckCircle as CheckCircleIcon 
} from '@mui/icons-material';
import { Student, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface StudentCardProps {
    student: Student;
    user: User;
    projectId: string | undefined;
    onEdit: () => void;
    onDelete: () => void;
    onApprove: () => void;
    onSelect: (studentId: string) => void;
    isSelected: boolean;
    onToggleAiAssistant: () => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ 
  student, 
  user, 
  projectId, 
  onEdit, 
  onDelete, 
  onApprove, 
  onSelect, 
  isSelected, 
  onToggleAiAssistant 
}) => {
    const t = useTranslations();
    
    const handleToggleAiAssistant = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onToggleAiAssistant();
    };

    return (
        <Card 
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: isSelected ? 2 : 0,
            borderColor: 'primary.main',
            '&:hover': {
              boxShadow: 4
            }
          }}
        >
            <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ pr: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {student.name} {student.surname}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium">
                            {student.studentId}
                        </Typography>
                    </Box>
                    <Checkbox
                        checked={isSelected}
                        onChange={() => onSelect(student.studentId)}
                        color="primary"
                    />
                </Box>

                <Stack spacing={1.5}>
                    <Box>
                        <Typography variant="caption" component="span" fontWeight="bold">
                            {t('major')}:{' '}
                        </Typography>
                        <Typography variant="caption" component="span">
                            {student.major}
                        </Typography>
                    </Box>
                    
                    <Box>
                        <Typography variant="caption" component="span" fontWeight="bold">
                            {t('classroom')}:{' '}
                        </Typography>
                        <Typography variant="caption" component="span">
                            {student.classroom}
                        </Typography>
                    </Box>
                    
                    <Box>
                        <Typography variant="caption" component="span" fontWeight="bold">
                            {t('status')}:{' '}
                        </Typography>
                        <Chip 
                          label={student.status} 
                          size="small"
                          color={student.status === 'Approved' ? 'success' : 'warning'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                    </Box>
                    
                    <Box>
                        <Typography variant="caption" component="span" fontWeight="bold">
                            {t('project')}:{' '}
                        </Typography>
                        <Typography variant="caption" component="span">
                            {projectId || t('na')}
                        </Typography>
                    </Box>

                    {user.role === 'Admin' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="caption" fontWeight="bold">
                                {t('aiAssistant')}:
                            </Typography>
                            <Switch
                                checked={student.isAiAssistantEnabled ?? true}
                                onChange={handleToggleAiAssistant}
                                size="small"
                            />
                        </Box>
                    )}
                </Stack>
            </CardContent>

            <Divider />

            <CardActions sx={{ justifyContent: 'flex-end', px: 2, py: 1 }}>
                {student.status === 'Pending' && (
                    <IconButton 
                      onClick={onApprove} 
                      size="small" 
                      color="success"
                      title={t('approve')}
                    >
                        <CheckCircleIcon />
                    </IconButton>
                )}
                <IconButton onClick={onEdit} size="small" color="primary">
                    <PencilIcon />
                </IconButton>
                <IconButton onClick={onDelete} size="small" color="error">
                    <TrashIcon />
                </IconButton>
            </CardActions>
        </Card>
    );
};

export default StudentCard;
