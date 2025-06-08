
import { useState, useEffect, useCallback } from 'react';
import { JobService, ProcessingJob } from '@/services/jobService';
import { useErrorHandler } from './useErrorHandler';

export function useJobPolling(jobId: number | null, onComplete?: (job: ProcessingJob) => void) {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const { handleError } = useErrorHandler();

  const pollJob = useCallback(async () => {
    if (!jobId) return;

    try {
      const jobData = await JobService.getJob(jobId);
      setJob(jobData);

      if (jobData.status === 'completed') {
        setIsPolling(false);
        onComplete?.(jobData);
      } else if (jobData.status === 'failed') {
        setIsPolling(false);
        handleError(jobData.errorMessage || 'Job failed', 'Job Processing');
      }
    } catch (error) {
      setIsPolling(false);
      handleError(error as Error, 'Job Polling');
    }
  }, [jobId, onComplete, handleError]);

  useEffect(() => {
    if (jobId && !isPolling) {
      setIsPolling(true);
      pollJob();
      const interval = setInterval(pollJob, 2000);
      
      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    }
  }, [jobId, isPolling, pollJob]);

  return {
    job,
    isPolling
  };
}
