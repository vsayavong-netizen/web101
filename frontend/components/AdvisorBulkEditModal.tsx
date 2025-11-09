import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, TextField, IconButton, Stack, Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslations } from '../hooks/useTranslations';

interface AdvisorBulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: {
        quota?: number;
        mainCommitteeQuota?: number;
        secondCommitteeQuota?: number;
        thirdCommitteeQuota?: number;
    }) => void;
    selectedCount: number;
}

const AdvisorBulkEditModal: React.FC<AdvisorBulkEditModalProps> = ({ isOpen, onClose, onSave, selectedCount }) => {
    const [updates, setUpdates] = useState<Record<string, string>>({});
    const t = useTranslations();
    
    const handleSave = () => {
        const finalUpdates: any = {};
        if (updates.quota) finalUpdates.quota = Number(updates.quota);
        if (updates.mainCommitteeQuota) finalUpdates.mainCommitteeQuota = Number(updates.mainCommitteeQuota);
        if (updates.secondCommitteeQuota) finalUpdates.secondCommitteeQuota = Number(updates.secondCommitteeQuota);
        if (updates.thirdCommitteeQuota) finalUpdates.thirdCommitteeQuota = Number(updates.thirdCommitteeQuota);
        onSave(finalUpdates);
    };

    const fields = [
        { key: 'quota', label: t('supervisingQuota') },
        { key: 'mainCommitteeQuota', label: t('mainCommitteeQuota') },
        { key: 'secondCommitteeQuota', label: t('secondCommitteeQuota') },
        { key: 'thirdCommitteeQuota', label: t('thirdCommitteeQuota') },
    ];

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">
                        {t('bulkEditAdvisorTitle').replace('{count}', String(selectedCount))}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Stack spacing={3}>
                    <Typography variant="body2" color="text.secondary">
                        {t('bulkEditAdvisorDescription')}
                    </Typography>
                    {fields.map(field => (
                        <TextField
                            key={field.key}
                            type="number"
                            id={`bulk-${field.key}`}
                            label={field.label}
                            placeholder={t('leaveBlankNoChange')}
                            onChange={e => setUpdates(prev => ({...prev, [field.key]: e.target.value}))}
                            fullWidth
                        />
                    ))}
                </Stack>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    {t('cancel')}
                </Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    {t('saveChanges')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdvisorBulkEditModal;
