import React from 'react';
import ConfettiExplosion from 'react-confetti-explosion';
import { useCelebration } from '../../contexts/CelebrationContext';

export const PaymentCelebration: React.FC = () => {
  const { showCelebration, celebrationData } = useCelebration();

  if (!showCelebration || !celebrationData) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <ConfettiExplosion
            force={0.8}
            duration={3000}
            particleCount={200}
            width={1600}
            colors={['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']}
          />
        </div>
      </div>

      <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] animate-bounce pointer-events-none">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl border-2 border-white">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🎉</div>
            <div>
              <div className="text-lg font-bold">Payment Collected!</div>
              <div className="text-sm opacity-90">
                {celebrationData.employeeName} collected ₹{celebrationData.amount.toLocaleString('en-IN')} from {celebrationData.customerName}
              </div>
            </div>
            <div className="text-3xl">🎊</div>
          </div>
        </div>
      </div>
    </>
  );
};
