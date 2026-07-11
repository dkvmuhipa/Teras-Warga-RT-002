import { useEffect } from 'react';
import { subscribeToCheckpoints, updateCheckpointPosition } from '../services/databaseService';

export const useCheckpointSubscription = (houseId: string, callback: (data: any) => void) => {
  useEffect(() => {
    const unsubscribe = subscribeToCheckpoints(houseId, callback);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [houseId, callback]);
};
