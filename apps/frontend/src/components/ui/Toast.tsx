import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const showError = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const showInfo = useCallback((msg) => addToast(msg, 'info'), [addToast]);
  const showToast = useCallback((msg, type = 'success') => addToast(msg, type), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showInfo, showToast }}>
      {children}
      {createPortal(
        <div
          className="fixed top-5 right-5 z-10000 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
          role="status"
          aria-live="polite"
          aria-atomic="false"
        >
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside ToastProvider
    return {
      showSuccess: (msg) => console.log('Toast success:', msg),
      showError: (msg) => console.error('Toast error:', msg),
      showInfo: (msg) => console.log('Toast info:', msg),
      showToast: (msg, type) => console.log(`Toast ${type}:`, msg),
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
}

function ToastItem({ toast, onClose }) {
  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 animate-fade-in ${
        isSuccess
          ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700/50 backdrop-blur-md'
          : isError
          ? 'bg-red-900/90 text-red-100 border-red-700/50 backdrop-blur-md'
          : 'bg-slate-900/90 text-slate-100 border-slate-700/50 backdrop-blur-md'
      }`}
    >
      <div className="flex items-center gap-3">
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
        {isError && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
        <span className="text-sm font-medium leading-snug">{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
