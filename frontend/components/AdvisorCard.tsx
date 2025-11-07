import React from 'react';
import {
  Card, CardContent, CardActions, Typography, Box,
  IconButton, Checkbox, Switch, Divider
} from '@mui/material';
import { Edit as PencilIcon, Delete as TrashIcon } from '@mui/icons-material';
import { Advisor, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface AdvisorCardProps {
    advisor: Advisor;
    user: User;
    projectCount: number;
    getMajorNames: (majorIds: string[]) => string;
    onEdit: () => void;
    onDelete: () => void;
    onSelect: (advisorId: string) => void;
    isSelected: boolean;
    onToggleAiAssistant: () => void;
}



const AdvisorCard: React.FC<AdvisorCardProps> = ({ advisor, user, projectCount, getMajorNames, onEdit, onDelete, onSelect, isSelected, onToggleAiAssistant }) => {
    const t = useTranslations();
    const isOverloaded = projectCount > advisor.quota;

    const handleToggleAiAssistant = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleAiAssistant();
    };

    return (
        <Card 
            variant="outlined" 
            sx={{ 
                bgcolor: 'action.hover', 
                position: 'relative',
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                border: isSelected ? 2 : 0,
                borderColor: isSelected ? 'primary.main' : 'transparent'
            }}
        >
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ pr: 2, flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {advisor.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium">
                            {advisor.id}
                        </Typography>
                    </Box>
                    <Checkbox
                        checked={isSelected}
                        onChange={() => onSelect(advisor.id)}
                        color="primary"
                    />
                </Box>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                        <Box component="strong">{t('projects')}:</Box>{' '}
                        <Box 
                            component="span" 
                            sx={{ 
                                color: isOverloaded ? 'error.main' : 'text.primary',
                                fontWeight: isOverloaded ? 'bold' : 'normal'
                            }}
                        >
                            {projectCount} / {advisor.quota}
                        </Box>
                    </Typography>
                    <Typography variant="body2">
                        <Box component="strong">{t('majors')}:</Box> {getMajorNames(advisor.specializedMajorIds)}
                    </Typography>
                    {user.role === 'Admin' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" component="strong">
                                {t('aiAssistant')}:
                            </Typography>
                            <Switch
                                checked={advisor.isAiAssistantEnabled ?? true}
                                onChange={handleToggleAiAssistant}
                                color="primary"
                            />
                        </Box>
                    )}
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

export default AdvisorCard;