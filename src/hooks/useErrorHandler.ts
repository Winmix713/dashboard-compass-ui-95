
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';

export function useErrorHandler() {
  const { toast } = useToast();
  const { dispatch } = useAppContext();

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    
    console.error('Error:', fullMessage);
    
    dispatch({ type: 'ADD_ERROR', payload: fullMessage });
    
    toast({
      title: 'Error',
      description: fullMessage,
      variant: 'destructive'
    });
  }, [dispatch, toast]);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' });
  }, [dispatch]);

  return {
    handleError,
    clearErrors
  };
}
