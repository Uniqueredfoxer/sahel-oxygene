import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  Bike,
  FileText,
  Send,
  Phone,
  XCircle,
  Zap,
} from 'lucide-react';
import api, { messageErreur } from '../../api/client';
import { getSocket } from '../../api/socket';
import { telechargerFichier } from '../../utils/download';
import StatutPill from '../../components/StatutPill';
import { useToast } from '../../context/ToastContext';

export default function CommandesTab() {
  const [livraisons, setLivraisons] = useState([]);
  const [statutFiltre, setStatutFiltre] = useState('');
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);
  const [livreurs, setLivreurs] = useState([]);
  const [erreur, setErreur] = useState('');
  const [telechargeId, setTelechargeId] = useState(null);
  const toast = useToast();

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const { data } = await api.get('/livraisons', {
        params: { statut: statutFiltre || undefined, recherche: recherche || undefined },
      });
      setLivraisons(data);
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setChargement(false);
    }
  }, [statutFiltre, recherche]);

  const chargerLivreurs = useCallback(async () => {
    try {
      const { data } = await api.get('/team');
      setLivreurs(data.filter((u) => u.roles.includes('livreur') && u.active));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    charger();
    chargerLivreurs();
  }, [charger, chargerLivreurs]);

  useEffect(() => {
    const socket = getSocket();
    const onMaj = () => {
      toast.info('Mise à jour reçue en direct');
      charger();
    };
    socket.on('livraison:nouvelle', onMaj);
    socket.on('livraison:maj', onMaj);
    return () => {
      socket.off('livraison:nouvelle', onMaj);
      socket.off('livraison:maj', onMaj);
    };
  }, [charger, toast]);

  const attribuer = async (id, livreurId) => {
    if (!livreurId) return;
    try {
      await api.patch(`/livraisons/${id}/attribuer`, { livreurId });
      toast.succes('Livreur assigné avec succès !');
      charger();
    } catch (err) {
      toast.erreur(messageErreur(err));
    }
  };

  const changerStatut = async (id, statut) => {
    try {
      await api.patch(`/livraisons/${id}/statut`, { statut });
      toast.info(`Statut modifié : ${statut}`);
      charger();
    } catch (err) {
      toast.erreur(messageErreur(err));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-sahel uppercase tracking-wider">Opérations en direct</span>
          <h1 className="font-display text-2xl font-bold text-slate-900">Dispatch & Commandes</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => charger()}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-4 shadow-card grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <input
            className="input text-xs pl-9"
            placeholder="Rechercher par numéro, téléphone client, quartier…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div>
          <select
            className="input text-xs font-medium"
            value={statutFiltre}
            onChange={(e) => setStatutFiltre(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="livree">Livrée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
      </div>

      {erreur && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {erreur}
        </div>
      )}

      {chargement && (
        <div className="card p-8 text-center space-y-3 shadow-card">
          <div className="route-line w-36 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Chargement des commandes…</p>
        </div>
      )}

      {/* Order cards */}
      <div className="space-y-3">
        {livraisons.map((l) => (
          <div
            key={l.id}
            className="card p-5 shadow-card hover:border-sahel-300 transition-all space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {l.numero}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-bold font-mono text-base text-slate-900">
                  {l.montant?.toLocaleString('fr-FR')} FCFA
                </span>
                <StatutPill statut={l.statut} />
              </div>
            </div>

            {/* Trajet details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trajet ({l.distanceKm} km)</span>
                  <p className="font-semibold text-slate-800 text-sm">{l.adresseDepart} → {l.adresseDestination}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{l.clientNom || 'Client'}</span>
                  <a
                    href={`tel:${l.clientTelephone}`}
                    className="font-mono font-bold text-sahel-dark hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{l.clientTelephone}</span>
                  </a>
                  {l.clientTelephone && (
                    <a
                      href={`https://wa.me/${l.clientTelephone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1"
                    >
                      <Send className="w-2.5 h-2.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Actions toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                {l.statut === 'en_attente' && (
                  <div className="flex items-center gap-2">
                    <select
                      className="input py-1.5 px-3 text-xs w-auto font-medium"
                      defaultValue=""
                      onChange={(e) => attribuer(l.id, e.target.value)}
                    >
                      <option value="" disabled>
                        Assigner un livreur…
                      </option>
                      {livreurs.map((lv) => (
                        <option key={lv.id} value={lv.id}>
                          {lv.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {l.livreur && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    <Bike className="w-3.5 h-3.5" />
                    <span>{l.livreur.name}</span>
                  </span>
                )}

                {l.statut !== 'livree' && l.statut !== 'annulee' && (
                  <button
                    className="text-xs font-medium text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1"
                    onClick={() => changerStatut(l.id, 'annulee')}
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Annuler</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary text-xs py-1.5 px-3 font-semibold flex items-center gap-1.5"
                  onClick={() => telechargerRecu(l)}
                  disabled={telechargeId === l.id}
                >
                  <FileText className="w-3.5 h-3.5 text-sahel" />
                  <span>{telechargeId === l.id ? 'Export…' : 'Reçu PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {!chargement && livraisons.length === 0 && (
          <div className="card p-10 text-center text-slate-400 text-xs font-medium shadow-card">
            Aucune commande ne correspond aux filtres sélectionnés.
          </div>
        )}
      </div>
    </div>
  );
}
