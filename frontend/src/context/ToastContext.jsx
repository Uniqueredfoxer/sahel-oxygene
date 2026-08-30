import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const ajouterToast = useCallback((message, type = 'info', duree = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duree > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duree);
    }
  }, []);

  const supprimerToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const succes = useCallback((msg, duree) => ajouterToast(msg, 'succes', duree), [ajouterToast]);
  const erreur = useCallback((msg, duree) => ajouterToast(msg, 'erreur', duree), [ajouterToast]);
  const info = useCallback((msg, duree) => ajouterToast(msg, 'info', duree), [ajouterToast]);

  return (
    <ToastContext.Provider value={{ toasts, ajouterToast, supprimerToast, succes, erreur, info }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all animate-slide-up ${
              t.type === 'succes'
                ? 'bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald/10'
                : t.type === 'erreur'
                ? 'bg-slate-900/95 text-white border-rose-500/40'
                : 'bg-slate-900/95 text-white border-sky-500/40'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-medium leading-relaxed">
              {t.type === 'succes' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {t.type === 'erreur' && (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              {t.type === 'info' && (
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
              )}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => supprimerToast(t.id)}
              className="text-slate-400 hover:text-white shrink-0 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
