import React from 'react';
import {
  Card, CardContent, CardActions, Typography, Box,
  IconButton, Avatar, Divider
} from '@mui/material';
import { 
  Edit as PencilIcon, Delete as TrashIcon,
  Groups as UserGroupIcon, Assignment as ClipboardDocumentListIcon
} from '@mui/icons-material';
import { Classroom } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface ClassroomCardProps {
    classroom: Classroom;
    studentCount: number;
    maleCount: number;
    femaleCount: number;
    monkCount: number;
    projectCount: number;
    soloProjectCount: number;
    duoProjectCount: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
    onEdit: () => void;
    onDelete: () => void;
    index: number;
}

const ClassroomCard: React.FC<ClassroomCardProps> = ({
    classroom,
    studentCount,
    maleCount,
    femaleCount,
    monkCount,
    projectCount,
    soloProjectCount,
    duoProjectCount,
    approvedCount,
    pendingCount,
    rejectedCount,
    onEdit,
    onDelete,
    index
}) => {
    const t = useTranslations();

    return (
        <Card variant="outlined" sx={{ bgcolor: 'action.hover', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Avatar
                sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    bgcolor: 'action.selected',
                    color: 'text.secondary',
                    width: 24,
                    height: 24,
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                }}
            >
                {index}
            </Avatar>
            <CardContent sx={{ pl: 6 }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {classroom.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                        {classroom.majorName}
                    </Typography>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <UserGroupIcon sx={{ fontSize: 16, mr: 1 }} />
                            <Typography variant="body2">{t('students')}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                            {studentCount}{' '}
                            <Typography component="span" variant="caption" color="text.secondary" fontWeight="normal">
                                ({t('male').charAt(0)}:{maleCount} {t('female').charAt(0)}:{femaleCount} {t('monk')}:{monkCount})
                            </Typography>
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <ClipboardDocumentListIcon sx={{ fontSize: 16, mr: 1 }} />
                            <Typography variant="body2">{t('projects')}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                            {projectCount}{' '}
                            <Typography component="span" variant="caption" color="text.secondary" fontWeight="normal">
                                (1P:{soloProjectCount}, 2P:{duoProjectCount})
                            </Typography>
                        </Typography>
                    </Box>
                    <Box sx={{ pl: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                            <Box component="span" fontWeight="bold" color="success.main">
                                {t('approved')}: {approvedCount}
                            </Box>
                            ,{' '}
                            <Box component="span" fontWeight="bold" color="warning.main">
                                {t('pending')}: {pendingCount}
                            </Box>
                            ,{' '}
                            <Box component="span" fontWeight="bold" color="error.main">
                                {t('rejected')}: {rejectedCount}
                            </Box>
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
            <Divider />
            <CardActions sx={{ justifyContent: 'flex-end', gap: 0.5 }}>
                <IconButton
                    onClick={onEdit}
                    size="small"
                    sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'action.hover' } }}
                >
                    <PencilIcon />
                </IconButton>
                <IconButton
                    onClick={onDelete}
                    size="small"
                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'action.hover' } }}
                >
                    <TrashIcon />
                </IconButton>
            </CardActions>
        </Card>
    );
};

export default ClassroomCard;