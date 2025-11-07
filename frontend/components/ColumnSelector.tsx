
import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Button, Popover, List, ListItem, ListItemButton, ListItemText,
    Checkbox, Divider, Typography, Stack
} from '@mui/material';
import { ChevronDownIcon } from './icons';
import { useTranslations } from '../hooks/useTranslations';

interface ColumnSelectorProps {
    allColumns: { key: string; label: string }[];
    selectedColumns: string[];
    setSelectedColumns: (keys: string[]) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ allColumns, selectedColumns, setSelectedColumns }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const t = useTranslations();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleToggleColumn = (key: string) => {
        const newSelected = selectedColumns.includes(key)
            ? selectedColumns.filter(c => c !== key)
            : [...selectedColumns, key];
        setSelectedColumns(newSelected);
    };
    
    const handleSelectAll = () => {
        if (selectedColumns.length === allColumns.length) {
            setSelectedColumns([]);
        } else {
            setSelectedColumns(allColumns.map(c => c.key));
        }
    };

    const open = Boolean(anchorEl);

    return (
        <Box>
            <Button
                variant="outlined"
                onClick={handleClick}
                endIcon={<ChevronDownIcon sx={{ width: 20, height: 20 }} />}
                sx={{
                    textTransform: 'none',
                    justifyContent: 'space-between',
                    width: '100%'
                }}
            >
                {t('columnsSelected').replace('{count}', String(selectedColumns.length))}
            </Button>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ width: 280, maxHeight: 360, overflow: 'auto' }}>
                    <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Checkbox
                                checked={selectedColumns.length === allColumns.length}
                                onChange={handleSelectAll}
                                size="small"
                            />
                            <Typography variant="body2" fontWeight="medium">
                                {t('allColumns')}
                            </Typography>
                        </Stack>
                    </Box>
                    <List dense>
                        {allColumns.map(column => (
                            <ListItem key={column.key} disablePadding>
                                <ListItemButton
                                    onClick={() => handleToggleColumn(column.key)}
                                    dense
                                >
                                    <Checkbox
                                        checked={selectedColumns.includes(column.key)}
                                        onChange={() => handleToggleColumn(column.key)}
                                        size="small"
                                        sx={{ mr: 1 }}
                                    />
                                    <ListItemText
                                        primary={column.label}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                            noWrap: true
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Popover>
        </Box>
    );
};

export default ColumnSelector;
