import React from 'react';
import { X } from 'lucide-react';

const CustomToast = ({ t }) => {
  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-100 text-green-600',
      text: 'text-green-800',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'bg-red-100 text-red-600',
      text: 'text-red-800',
    },
    loading: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      text: 'text-blue-800',
    },
  };

  const styles = typeStyles[t.type] || typeStyles.success;

  return (
    <div
      className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md flex items-start gap-3 relative transition-all duration-300 ease-in-out`}
      style={{
        animation: 'slideInFromRight 0.3s ease-out',
      }}
    >
      <div className={`w-8 h-8 ${styles.icon} rounded-full flex items-center justify-center flex-shrink-0`}>
        {t.type === 'success' && (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        {t.type === 'error' && (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
        {t.type === 'loading' && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      
      <div className={`flex-1 ${styles.text} text-sm font-medium`}>
        {t.message}
      </div>
      
      <button
        onClick={() => t.dismiss()}
        className={`absolute top-2 right-2 w-6 h-6 ${styles.icon} rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-all hover:scale-110 cursor-pointer`}
        aria-label="Close notification"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default CustomToast;
