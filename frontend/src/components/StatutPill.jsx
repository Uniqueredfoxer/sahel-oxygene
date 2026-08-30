const CONFIG = {
  en_attente: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-500',
    pulse: true,
    label: 'En attente',
  },
  en_cours: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200/60',
    dot: 'bg-sky-500',
    pulse: true,
    label: 'En cours',
  },
  livree: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    dot: 'bg-emerald-500',
    pulse: false,
    label: 'Livrée',
  },
  annulee: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    pulse: false,
    label: 'Annulée',
  },
};

export default function StatutPill({ statut, className = '' }) {
  const cfg = CONFIG[statut] || {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    pulse: false,
    label: statut || 'Inconnu',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${cfg.badge} ${className}`}>
      <span className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
      </span>
      <span>{cfg.label}</span>
    </span>
  );
}
