import React, { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onShortcut: (action: string) => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onShortcut }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Check for keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'd':
            event.preventDefault();
            onShortcut('dashboard');
            break;
          case 'p':
            event.preventDefault();
            onShortcut('profile');
            break;
          case 'c':
            event.preventDefault();
            onShortcut('customer-cases');
            break;
          case 's':
            event.preventDefault();
            onShortcut('search');
            break;
          case '/':
            event.preventDefault();
            onShortcut('help');
            break;
        }
      } else {
        switch (event.key.toLowerCase()) {
          case 'f1':
            event.preventDefault();
            onShortcut('help');
            break;
          case 'escape':
            event.preventDefault();
            onShortcut('close-modal');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onShortcut]);

  return null; // This component doesn't render anything
};

export default KeyboardShortcuts;