import { useEffect, useState } from 'react';
import { RefreshCw, FileText, Trash2 } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { telechargerFichier } from '../../utils/download';
import StatutPill from '../../components/StatutPill';
import { useToast } from '../../context/ToastContext';

export default function LivraisonsTab() {
  const { aLeRole } = useAuth();
  const [livraisons, setLivraisons] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [telechargeId, setTelechargeId] = useState(null);
  const toast = useToast();

  const charger = () => {
    setChargement(true);
    api
      .get('/livraisons')
      .then((r) => setLivraisons(r.data))
      .catch(() => toast.erreur('Erreur de chargement des livraisons.'))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  const supprimer = async (id, numero) => {
    if (!window.confirm(`Supprimer définitivement la course ${numero} ? Cette action est irréversible.`)) {
      return;
    }
    try {
      await api.delete(`/livraisons/${id}`);
      toast.succes(`Livraison ${numero} supprimée.`);
      charger();
    } catch {
      toast.erreur('Impossible de supprimer cette livraison.');
    }
  };

  const telechargerRecu = async (livraison) => {
    setTelechargeId(livraison.id);
    try {
      await telechargerFichier(`/livraisons/${livraison.id}/recu`, `recu-${livraison.numero}.pdf`);
      toast.succes('Reçu téléchargé avec succès');
    } catch (err) {
      toast.erreur(messageErreur(err) || 'Impossible de générer le reçu.');
    } finally {
      setTelechargeId(null);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-sahel uppercase tracking-wider">Archives</span>
          <h1 className="font-display text-2xl font-bold text-slate-900">Historique des courses</h1>
        </div>
        <button
          onClick={charger}
          className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {chargement && (
        <div className="card p-8 text-center space-y-3 shadow-card">
          <div className="route-line w-36 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Chargement de l'historique…</p>
        </div>
      )}

      {!chargement && (
        <div className="card overflow-hidden shadow-card border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Numéro</th>
                  <th className="px-4 py-3.5">Trajet</th>
                  <th className="px-4 py-3.5">Montant</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5">Livreur</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {livraisons.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800">{l.numero}</td>
                    <td className="px-4 py-3.5 max-w-xs truncate text-slate-700">
                      {l.adresseDepart} → {l.adresseDestination}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {l.montant?.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-4 py-3.5">
                      <StatutPill statut={l.statut} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{l.livreur?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        className="text-xs text-sahel font-semibold hover:underline inline-flex items-center gap-1"
                        onClick={() => telechargerRecu(l)}
                        disabled={telechargeId === l.id}
                      >
                        <FileText className="w-3 h-3" />
                        <span>{telechargeId === l.id ? 'Export…' : 'Reçu'}</span>
                      </button>
                      {aLeRole('administrateur') && (
                        <button
                          className="text-xs text-rose-600 font-medium hover:underline inline-flex items-center gap-1"
                          onClick={() => supprimer(l.id, l.numero)}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Supprimer</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {livraisons.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              Aucune livraison enregistrée dans la base de données.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
