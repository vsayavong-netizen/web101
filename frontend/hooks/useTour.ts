import { useState, useEffect, useCallback } from 'react';

type TourKey = 'student-welcome-tour' | 'advisor-dashboard-tour';

export const useTour = (tourKey: TourKey | null) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (!tourKey) {
            setIsActive(false);
            return;
        }
        
        // Use a timeout to allow the UI to render before starting the tour
        const timer = setTimeout(() => {
            try {
                const hasCompletedTour = localStorage.getItem(`tourCompleted_${tourKey}`);
                if (!hasCompletedTour) {
                    setIsActive(true);
                    setCurrentStep(0);
                }
            } catch (error) {
                console.error("Could not access localStorage:", error);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [tourKey]);
    
    const startTour = useCallback(() => {
        if (tourKey) {
            setIsActive(true);
            setCurrentStep(0);
        }
    }, [tourKey]);

    const nextStep = useCallback(() => {
        setCurrentStep(prev => prev + 1);
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    }, []);

    const finishTour = useCallback(() => {
        if (tourKey) {
            try {
                localStorage.setItem(`tourCompleted_${tourKey}`, 'true');
            } catch (error) {
                console.error("Could not write to localStorage:", error);
            }
        }
        setIsActive(false);
    }, [tourKey]);

    return {
        isActive,
        currentStep,
        startTour,
        nextStep,
        prevStep,
        finishTour,
    };
};
