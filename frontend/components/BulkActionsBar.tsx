import React from 'react';
import {
  Box, Paper, Typography, Button, IconButton, Stack
} from '@mui/material';
import { ChatBubbleOutline as ChatBubbleIcon, Close as CloseIcon } from '@mui/icons-material';
import { useTranslations } from '../hooks/useTranslations';

interface BulkActionsBarProps {
    selectedCount: number;
    onClear: () => void;
    onSendMessage: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ selectedCount, onClear, onSendMessage }) => {
    const t = useTranslations();
    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '42rem',
                zIndex: 1300
            }}
        >
            <Paper
                elevation={8}
                sx={{
                    bgcolor: 'grey.800',
                    color: 'white',
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: 2
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" fontWeight="medium">
                        {t('bulkActionsSelected').replace('${count}', String(selectedCount))}
                    </Typography>
                    <Button
                        onClick={onSendMessage}
                        variant="contained"
                        size="small"
                        startIcon={<ChatBubbleIcon />}
                        sx={{ textTransform: 'none' }}
                    >
                        {t('sendMessage')}
                    </Button>
                </Stack>
                <IconButton
                    onClick={onClear}
                    size="small"
                    sx={{ color: 'white', '&:hover': { bgcolor: 'grey.700' } }}
                >
                    <CloseIcon />
                </IconButton>
            </Paper>
        </Box>
    );
};

export default BulkActionsBar;