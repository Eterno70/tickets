import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  sender?: string;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, sender, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white shadow-lg rounded-lg px-5 py-4 flex items-center space-x-3 border-l-4 border-blue-500 animate-fade-in-up">
      <div>
        <div className="font-semibold text-blue-700 text-sm">
          {sender ? `${sender} te ha enviado un mensaje:` : 'Nuevo mensaje de chat'}
        </div>
        <div className="text-gray-800 text-base max-w-xs truncate">
          {message}
        </div>
      </div>
      <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-700 text-lg">&times;</button>
    </div>
  );
};

export default Toast; 