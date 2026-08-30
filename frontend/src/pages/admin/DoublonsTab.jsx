import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, Copy } from 'lucide-react';
import api from '../../api/client';

export default function DoublonsTab() {
  const [groupes, setGroupes] = useState([]);
  const [chargement, setChargement] = useState(true);

  const charger = () => {
    setChargement(true);
    api
      .get('/livraisons/doublons')
      .then((r) => setGroupes(r.data))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  return (
    <div className="max-w-2xl space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-sahel uppercase tracking-wider">Qualité des Données</span>
          <h1 className="font-display text-2xl font-bold text-slate-900">Détection des doublons</h1>
          <p className="text-slate-500 text-xs mt-1">
            Numéros clients saisis avec des préfixes différents mais correspondant au même contact.
          </p>
        </div>
        <button onClick={charger} className="btn-secondary text-xs py-2 px-3 font-semibold flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {chargement && (
        <div className="card p-8 text-center space-y-3 shadow-card">
          <div className="route-line w-36 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Analyse des numéros en cours…</p>
        </div>
      )}

      {!chargement && groupes.length === 0 && (
        <div className="card p-10 text-center space-y-3 shadow-card border-emerald-100 bg-emerald-50/20">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Base de données propre</h3>
          <p className="text-xs text-slate-500">Aucun doublon de numéro de téléphone détecté.</p>
        </div>
      )}

      <div className="space-y-3">
        {groupes.map((g) => (
          <div key={g.clientTelephoneNormalise} className="card p-5 shadow-card space-y-2 border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Racine commune (8 chiffres) :{' '}
                <span className="font-mono text-slate-800 font-bold">…{g.clientTelephoneNormalise}</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">
                {g.telephones?.length} variantes
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[...new Set(g.telephones)].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
