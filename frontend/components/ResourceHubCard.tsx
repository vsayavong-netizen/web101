import React from 'react';
import {
  Paper, Typography, Box, List, ListItem, Link
} from '@mui/material';
import { MenuBook as BookOpenIcon, Link as LinkIcon } from '@mui/icons-material';
import { useTranslations } from '../hooks/useTranslations';

const ResourceHubCard: React.FC = () => {
    const t = useTranslations();
    const resources = [
        { title: 'Thesis Writing Guide', url: '#' },
        { title: 'Presentation Skills Workshop', url: '#' },
        { title: 'Library Research Database', url: '#' },
    ];
    
    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BookOpenIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="medium">
                    {t('resourceHub')}
                </Typography>
            </Box>
            <List>
                {resources.map((res, index) => (
                    <ListItem key={index} disablePadding>
                        <Link
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                color: 'primary.main',
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                                width: '100%'
                            }}
                        >
                            <LinkIcon sx={{ fontSize: 16 }} />
                            <Typography variant="body2" fontWeight="medium">
                                {res.title}
                            </Typography>
                        </Link>
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default ResourceHubCard;