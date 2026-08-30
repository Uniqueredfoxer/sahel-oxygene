import { useEffect, useState } from 'react';
import { Shield, RefreshCw, Search, Check, Plus, UserCheck, UserX } from 'lucide-react';
import api, { messageErreur } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const ROLES = [
  { id: 'administrateur', label: 'Administrateur', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'gestionnaire', label: 'Gestionnaire', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'livreur', label: 'Livreur', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'vendeur_gaz', label: 'Vendeur Gaz', color: 'bg-amber-50 text-amber-700 border-amber-200' },
];

export default function EquipeTab() {
  const [comptes, setComptes] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const toast = useToast();

  const charger = () => {
    setChargement(true);
    api
      .get('/team')
      .then((r) => setComptes(r.data))
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  const basculerRole = async (userId, role, actif, userName) => {
    try {
      if (actif) {
        await api.delete(`/team/${userId}/roles/${role}`);
        toast.info(`Rôle ${role} retiré à ${userName}`);
      } else {
        await api.post(`/team/${userId}/roles`, { role });
        toast.succes(`Rôle ${role} attribué à ${userName}`);
      }
      charger();
    } catch (err) {
      toast.erreur(messageErreur(err));
    }
  };

  const basculerCompte = async (userId, active, userName) => {
    try {
      await api.patch(`/team/${userId}`, { active: !active });
      toast.info(`Compte de ${userName} ${!active ? 'activé' : 'désactivé'}`);
      charger();
    } catch (err) {
      toast.erreur(messageErreur(err));
    }
  };

  const comptesFiltres = comptes.filter(
    (c) =>
      c.name.toLowerCase().includes(recherche.toLowerCase()) ||
      c.email.toLowerCase().includes(recherche.toLowerCase()) ||
      (c.phone && c.phone.includes(recherche))
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sahel uppercase tracking-wider">Sécurité & Permissions</span>
          <h1 className="font-display text-2xl font-bold text-slate-900">Gestion de l'équipe</h1>
          <p className="text-slate-500 text-xs mt-1">
            Activez les comptes et accordez des rôles aux collaborateurs.
          </p>
        </div>

        <button
          onClick={charger}
          className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-3 shadow-card max-w-md relative">
        <input
          className="input text-xs pl-9"
          placeholder="Rechercher un membre par nom, email, tél…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
      </div>

      {erreur && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {erreur}
        </div>
      )}

      {chargement && (
        <div className="card p-8 text-center space-y-3 shadow-card">
          <div className="route-line w-36 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Chargement des membres…</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comptesFiltres.map((c) => (
          <div
            key={c.id}
            className={`card p-5 shadow-card space-y-4 transition-all ${
              !c.active ? 'opacity-60 bg-slate-50' : 'bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-sm border border-slate-200">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.email}</p>
                  {c.phone && <p className="text-[11px] font-mono text-slate-400">{c.phone}</p>}
                </div>
              </div>

              <button
                onClick={() => basculerCompte(c.id, c.active, c.name)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                  c.active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                {c.active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                <span>{c.active ? 'Actif' : 'Bloqué'}</span>
              </button>
            </div>

            {/* Role toggles */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Rôles attribués
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((r) => {
                  const actif = c.roles.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => basculerRole(c.id, r.id, actif, c.name)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                        actif
                          ? 'bg-sahel text-white border-sahel-dark shadow-xs'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      {actif ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
