import React from 'react';
import {
  Card, CardContent, CardActions, Typography, Box,
  IconButton, Chip, Divider
} from '@mui/material';
import { 
  Edit as PencilIcon, Delete as TrashIcon,
  Groups as UserGroupIcon, Business as BuildingOfficeIcon,
  Assignment as ClipboardDocumentListIcon
} from '@mui/icons-material';
import { Major } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface MajorCardProps {
    major: Major;
    studentCount: number;
    classroomCount: number;
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
}

const MajorCard: React.FC<MajorCardProps> = ({ major, studentCount, classroomCount, maleCount, femaleCount, monkCount, projectCount, soloProjectCount, duoProjectCount, approvedCount, pendingCount, rejectedCount, onEdit, onDelete }) => {
    const t = useTranslations();

    return (
        <Card variant="outlined" sx={{ bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ pr: 2, flex: 1 }}>
                        {major.name}
                    </Typography>
                    <Chip 
                        label={major.abbreviation} 
                        size="small" 
                        color="primary" 
                        sx={{ flexShrink: 0 }}
                    />
                </Box>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    {major.id}
                </Typography>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                            <BuildingOfficeIcon sx={{ fontSize: 16, mr: 1 }} />
                            <Typography variant="body2">{t('classrooms')}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                            {classroomCount}
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

export default MajorCard;