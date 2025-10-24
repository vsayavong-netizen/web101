import React, { useState, useLayoutEffect } from 'react';
import { Paper, Typography, Button, IconButton, Box, Stack, Fade } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { TourStep } from '../config/tourSteps';
import { useTranslations } from '../hooks/useTranslations';

interface TourGuideProps {
    isActive: boolean;
    currentStep: number;
    tourSteps: TourStep[];
    nextStep: () => void;
    prevStep: () => void;
    finishTour: () => void;
}

const TourGuide: React.FC<TourGuideProps> = ({ 
  isActive, 
  currentStep, 
  tourSteps, 
  nextStep, 
  prevStep, 
  finishTour 
}) => {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const step = tourSteps[currentStep];
    const t = useTranslations();

    useLayoutEffect(() => {
        if (isActive && step?.target) {
            const targetElement = document.querySelector(step.target);
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                setTargetRect(rect);
                targetElement.classList.add('tour-highlight');
            } else {
                setTargetRect(null);
            }
        }

        // Cleanup previous highlight
        return () => {
             if (step?.target) {
                const targetElement = document.querySelector(step.target);
                targetElement?.classList.remove('tour-highlight');
            }
        };
    }, [isActive, currentStep, step]);

    if (!isActive || !step || !targetRect) {
        return null;
    }

    const tooltipStyle: React.CSSProperties = {};
    const arrowStyle: React.CSSProperties = {};
    const placement = step.placement || 'bottom';

    switch (placement) {
        case 'top':
            tooltipStyle.top = `${targetRect.top - 8}px`;
            tooltipStyle.left = `${targetRect.left + targetRect.width / 2}px`;
            tooltipStyle.transform = 'translate(-50%, -100%)';
            arrowStyle.top = '100%';
            arrowStyle.left = '50%';
            arrowStyle.transform = 'translateX(-50%)';
            arrowStyle.borderTopColor = 'rgb(30 41 59)';
            arrowStyle.borderBottomColor = 'transparent';
            break;
        case 'left':
            tooltipStyle.top = `${targetRect.top + targetRect.height / 2}px`;
            tooltipStyle.left = `${targetRect.left - 8}px`;
            tooltipStyle.transform = 'translate(-100%, -50%)';
            arrowStyle.left = '100%';
            arrowStyle.top = '50%';
            arrowStyle.transform = 'translateY(-50%)';
            arrowStyle.borderLeftColor = 'rgb(30 41 59)';
            arrowStyle.borderRightColor = 'transparent';
            break;
        case 'right':
            tooltipStyle.top = `${targetRect.top + targetRect.height / 2}px`;
            tooltipStyle.left = `${targetRect.right + 8}px`;
            tooltipStyle.transform = 'translateY(-50%)';
            arrowStyle.right = '100%';
            arrowStyle.top = '50%';
            arrowStyle.transform = 'translateY(-50%)';
            arrowStyle.borderRightColor = 'rgb(30 41 59)';
            arrowStyle.borderLeftColor = 'transparent';
            break;
        case 'center':
             tooltipStyle.top = '50%';
             tooltipStyle.left = '50%';
             tooltipStyle.transform = 'translate(-50%, -50%)';
             break;
        case 'bottom':
        default:
            tooltipStyle.top = `${targetRect.bottom + 8}px`;
            tooltipStyle.left = `${targetRect.left + targetRect.width / 2}px`;
            tooltipStyle.transform = 'translateX(-50%)';
            arrowStyle.bottom = '100%';
            arrowStyle.left = '50%';
            arrowStyle.transform = 'translateX(-50%)';
            arrowStyle.borderBottomColor = 'rgb(30 41 59)';
            arrowStyle.borderTopColor = 'transparent';
            break;
    }

    const isLastStep = currentStep === tourSteps.length - 1;

    return (
        <>
            <style>{`.tour-highlight { z-index: 10001 !important; position: relative !important; box-shadow: 0 0 0 9999px rgba(0,0,0,0.5); border-radius: 4px; }`}</style>
            <Fade in={true}>
                <Box
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10000,
                    }}
                >
                    <Paper
                        elevation={24}
                        sx={{
                            position: 'fixed',
                            ...tooltipStyle,
                            bgcolor: 'grey.800',
                            color: 'white',
                            borderRadius: 2,
                            p: 2,
                            width: 288,
                            zIndex: 10002,
                        }}
                        role="dialog"
                        aria-labelledby="tour-title"
                    >
                        {placement !== 'center' && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    width: 0,
                                    height: 0,
                                    border: '8px solid',
                                    ...arrowStyle,
                                }}
                            />
                        )}
                        
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography id="tour-title" variant="subtitle1" fontWeight="bold">
                                    {step.title}
                                </Typography>
                                <IconButton 
                                    onClick={finishTour} 
                                    size="small"
                                    sx={{ color: 'grey.400', '&:hover': { color: 'white' } }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            <Typography variant="body2" sx={{ color: 'grey.300' }}>
                                {step.content}
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'grey.500' }}>
                                    {currentStep + 1} / {tourSteps.length}
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    {currentStep > 0 && (
                                        <Button
                                            onClick={prevStep}
                                            size="small"
                                            variant="contained"
                                            sx={{ 
                                                bgcolor: 'grey.600', 
                                                '&:hover': { bgcolor: 'grey.500' },
                                                textTransform: 'none'
                                            }}
                                        >
                                            {t('back')}
                                        </Button>
                                    )}
                                    <Button
                                        onClick={isLastStep ? finishTour : nextStep}
                                        size="small"
                                        variant="contained"
                                        color="primary"
                                        sx={{ textTransform: 'none' }}
                                    >
                                        {isLastStep ? t('finish') : t('next')}
                                    </Button>
                                </Stack>
                            </Box>
                        </Stack>
                    </Paper>
                </Box>
            </Fade>
        </>
    );
};

export default TourGuide;
