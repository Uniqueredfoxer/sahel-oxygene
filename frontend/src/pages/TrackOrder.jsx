import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Bike,
  Phone,
  FileText,
  AlertOctagon,
  Plus,
} from 'lucide-react';
import api from '../api/client';
import Logo from '../components/Logo';
import StatutPill from '../components/StatutPill';

const ETAPES_SUIVI = [
  { statut: 'en_attente', titre: 'Commande reçue', desc: 'En attente d’attribution à un livreur' },
  { statut: 'en_cours', titre: 'Prise en charge', desc: 'Le livreur est en route pour la livraison' },
  { statut: 'livree', titre: 'Livrée avec succès', desc: 'Course terminée et signée' },
];

export default function TrackOrder() {
  const { numero: numeroParam } = useParams();
  const [numero, setNumero] = useState(numeroParam || '');
  const [livraison, setLivraison] = useState(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  const rechercher = async (n) => {
    if (!n || !n.trim()) return;
    setChargement(true);
    setErreur('');
    setLivraison(null);
    try {
      const { data } = await api.get(`/public/suivi/${n.trim()}`);
      setLivraison(data.livraison);
    } catch {
      setErreur('Aucune commande trouvée avec ce numéro. Vérifiez la saisie.');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (numeroParam) rechercher(numeroParam);
  }, [numeroParam]);

  const indexStatutActuel = () => {
    if (!livraison) return 0;
    if (livraison.statut === 'en_attente') return 0;
    if (livraison.statut === 'en_cours') return 1;
    if (livraison.statut === 'livree') return 2;
    return -1; // annulee
  };

  return (
    <div className="min-h-screen flex flex-col bg-sable-50">
      <header className="px-5 py-3.5 border-b border-charbon-100 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <Logo />
        <Link
          to="/"
          className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-emerald-50 text-sahel-dark hover:bg-emerald-100 transition-colors border border-emerald-200/50 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouvelle commande</span>
        </Link>
      </header>

      <main className="flex-1 px-5 py-8 max-w-lg mx-auto w-full space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Suivi de livraison</h1>
          <p className="text-slate-500 text-sm mt-1">Consultez l'état d'avancement de votre course en temps réel.</p>
        </div>

        {/* Search input form */}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (numero.trim()) {
              navigate(`/suivi/${numero.trim()}`);
              rechercher(numero.trim());
            }
          }}
        >
          <div className="relative flex-1">
            <input
              className="input font-mono uppercase text-sm pl-9"
              placeholder="Ex : PDX-20260826-0001"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button type="submit" className="btn-primary shrink-0 px-6 flex items-center gap-1.5">
            <span>Suivre</span>
          </button>
        </form>

        {chargement && (
          <div className="card p-8 text-center space-y-4 shadow-card animate-slide-up">
            <div className="route-line w-40 mx-auto" />
            <p className="text-xs font-medium text-slate-500">Recherche de votre commande…</p>
          </div>
        )}

        {erreur && (
          <div className="card p-6 text-center space-y-2 border-rose-200 bg-rose-50/50 animate-slide-up">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-rose-800">{erreur}</p>
          </div>
        )}

        {livraison && (
          <div className="space-y-4 animate-slide-up">
            {/* Status Card */}
            <div className="card p-6 shadow-card space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Numéro de course</span>
                  <p className="font-mono font-bold text-base text-slate-800">{livraison.numero}</p>
                </div>
                <StatutPill statut={livraison.statut} />
              </div>

              {/* Step progression */}
              {livraison.statut !== 'annulee' ? (
                <div className="py-2">
                  <div className="space-y-6 relative">
                    {ETAPES_SUIVI.map((etapeItem, i) => {
                      const actuel = indexStatutActuel() === i;
                      const termine = indexStatutActuel() > i;
                      return (
                        <div key={etapeItem.statut} className="flex items-start gap-3.5 relative z-10">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                actuel
                                  ? 'bg-sahel text-white ring-4 ring-emerald-100'
                                  : termine
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}
                            >
                              {termine ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                            </div>
                            {i < ETAPES_SUIVI.length - 1 && (
                              <div
                                className={`w-0.5 h-10 my-1 ${
                                  termine ? 'bg-emerald-500' : 'bg-slate-200'
                                }`}
                              />
                            )}
                          </div>
                          <div className="pt-0.5">
                            <p
                              className={`text-sm font-bold ${
                                actuel
                                  ? 'text-sahel-dark'
                                  : termine
                                  ? 'text-slate-800'
                                  : 'text-slate-400'
                              }`}
                            >
                              {etapeItem.titre}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{etapeItem.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <AlertOctagon className="w-6 h-6 text-rose-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Cette commande a été annulée</p>
                </div>
              )}

              {/* Trajet & details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div className="w-0.5 h-8 bg-slate-300 my-1" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  </div>
                  <div className="flex-1 space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold uppercase">Départ</span>
                      <p className="font-medium text-slate-800 text-sm">{livraison.adresseDepart}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold uppercase">Destination</span>
                      <p className="font-medium text-slate-800 text-sm">{livraison.adresseDestination}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Livreur card if assigned */}
              {livraison.livreur && (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Bike className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sahel">Livreur assigné</span>
                      <p className="font-semibold text-slate-900 text-sm">{livraison.livreur.name}</p>
                    </div>
                  </div>
                  {livraison.livreur.phone && (
                    <a
                      href={`tel:${livraison.livreur.phone}`}
                      className="px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-xs font-semibold text-sahel-dark shadow-sm hover:bg-emerald-50 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Appeler</span>
                    </a>
                  )}
                </div>
              )}

              {/* Price & Receipt */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Montant total</span>
                <span className="font-display font-bold font-mono text-xl text-slate-900">
                  {livraison.montant.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {livraison.statut === 'livree' && (
                <a
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                  href={`/api/public/recu/${livraison.qrToken}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText className="w-4 h-4 text-sahel" />
                  <span>Télécharger le reçu officiel PDF</span>
                </a>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
