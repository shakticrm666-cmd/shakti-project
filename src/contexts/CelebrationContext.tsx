import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface CelebrationData {
  employeeName: string;
  amount: number;
  customerName: string;
  timestamp: number;
}

interface CelebrationContextType {
  showCelebration: boolean;
  celebrationData: CelebrationData | null;
  triggerCelebration: (data: Omit<CelebrationData, 'timestamp'>) => void;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within CelebrationProvider');
  }
  return context;
};

interface CelebrationProviderProps {
  children: React.ReactNode;
  tenantId?: string;
  teamId?: string;
}

export const CelebrationProvider: React.FC<CelebrationProviderProps> = ({
  children,
  tenantId,
  teamId
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  const triggerCelebration = useCallback((data: Omit<CelebrationData, 'timestamp'>) => {
    const fullData: CelebrationData = {
      ...data,
      timestamp: Date.now()
    };

    setCelebrationData(fullData);
    setShowCelebration(true);

    if (tenantId && teamId && typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel(`team-celebrations-${tenantId}-${teamId}`);
        channel.postMessage({
          type: 'PAYMENT_COLLECTED',
          data: fullData
        });
        channel.close();
      } catch (error) {
        console.error('Error broadcasting celebration:', error);
      }
    }

    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  }, [tenantId, teamId]);

  useEffect(() => {
    if (!tenantId || !teamId || typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(`team-celebrations-${tenantId}-${teamId}`);

    channel.onmessage = (event) => {
      if (event.data.type === 'PAYMENT_COLLECTED') {
        const data = event.data.data as CelebrationData;
        setCelebrationData(data);
        setShowCelebration(true);

        setTimeout(() => {
          setShowCelebration(false);
        }, 3000);
      }
    };

    return () => {
      channel.close();
    };
  }, [tenantId, teamId]);

  return (
    <CelebrationContext.Provider value={{ showCelebration, celebrationData, triggerCelebration }}>
      {children}
    </CelebrationContext.Provider>
  );
};
